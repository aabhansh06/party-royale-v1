import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { Server } from 'socket.io';
import { io as createClient } from 'socket.io-client';
import { attachGameSocket } from '../src/sockets/gameSocket.js';

const connectClient=async url=>{const client=createClient(url,{transports:['websocket'],reconnection:false});await once(client,'connect');return client;};
const ack=(client,event,payload)=>new Promise(resolve=>client.emit(event,payload,resolve));

test('Socket.IO integration: host creates a private room, guest joins, host starts synchronized match',async t=>{
  const httpServer=http.createServer();const io=new Server(httpServer);attachGameSocket(io);
  await new Promise(resolve=>httpServer.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${httpServer.address().port}`;const host=await connectClient(url);const guest=await connectClient(url);
  t.after(()=>{host.disconnect();guest.disconnect();io.close();httpServer.close();});
  const created=await ack(host,'room:create',{nickname:'Host'});
  assert.equal(created.ok,true);assert.match(created.code,/^[A-Z2-9]{6}$/);
  const hostLobbyUpdate=once(host,'game:state');
  const joined=await ack(guest,'room:join',{code:created.code,nickname:'Guest'});
  await hostLobbyUpdate;
  assert.equal(joined.ok,true);assert.equal(joined.state.players.length,2);
  const hostState=once(host,'game:state');const guestState=once(guest,'game:state');
  const started=await ack(host,'room:start',{});assert.equal(started.ok,true);
  const [hostUpdate,guestUpdate]=await Promise.all([hostState,guestState]);
  assert.equal(hostUpdate[0].status,'PLAYING');assert.equal(guestUpdate[0].status,'PLAYING');
  assert.equal(hostUpdate[0].currentQuestion.id,guestUpdate[0].currentQuestion.id);
  assert.equal(hostUpdate[0].round,1);
});

test('Socket.IO integration: non-host cannot start a match',async t=>{
  const httpServer=http.createServer();const io=new Server(httpServer);attachGameSocket(io);
  await new Promise(resolve=>httpServer.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${httpServer.address().port}`;const host=await connectClient(url);const guest=await connectClient(url);
  t.after(()=>{host.disconnect();guest.disconnect();io.close();httpServer.close();});
  const created=await ack(host,'room:create',{nickname:'Host'});await ack(guest,'room:join',{code:created.code,nickname:'Guest'});
  const result=await ack(guest,'room:start',{});assert.equal(result.ok,false);assert.match(result.error,/Only the host/);
});

test('Socket.IO integration: guest disconnect resolves question if remaining players answered',async t=>{
  const httpServer=http.createServer();const io=new Server(httpServer);attachGameSocket(io);
  await new Promise(resolve=>httpServer.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${httpServer.address().port}`;const host=await connectClient(url);const guest=await connectClient(url);
  t.after(()=>{host.disconnect();guest.disconnect();io.close();httpServer.close();});
  const created=await ack(host,'room:create',{nickname:'Host'});
  await ack(guest,'room:join',{code:created.code,nickname:'Guest'});
  const started=await ack(host,'room:start',{});
  assert.equal(started.ok,true);
  const resultPromise=once(host,'game:question-result');
  await ack(host,'game:answer',{answerIndex:0});
  guest.disconnect();
  const [result]=await resultPromise;
  assert.ok(result);
  assert.match(result.questionId,/^q\d+$/);
});

test('Socket.IO integration: host disconnect transfers host role to guest',async t=>{
  const httpServer=http.createServer();const io=new Server(httpServer);attachGameSocket(io);
  await new Promise(resolve=>httpServer.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${httpServer.address().port}`;const host=await connectClient(url);const guest=await connectClient(url);
  t.after(()=>{host.disconnect();guest.disconnect();io.close();httpServer.close();});
  const created=await ack(host,'room:create',{nickname:'Host'});
  await ack(guest,'room:join',{code:created.code,nickname:'Guest'});
  const guestStatePromise=once(guest,'game:state');
  host.disconnect();
  const [guestState]=await guestStatePromise;
  assert.equal(guestState.players.length,1);
  assert.equal(guestState.hostId,guest.id);
});

test('Socket.IO integration: duplicate nickname rejection and full answer scoring',async t=>{
  const httpServer=http.createServer();const io=new Server(httpServer);const {rooms}=attachGameSocket(io);
  await new Promise(resolve=>httpServer.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${httpServer.address().port}`;const host=await connectClient(url);const guest=await connectClient(url);const imposter=await connectClient(url);
  t.after(()=>{host.disconnect();guest.disconnect();imposter.disconnect();io.close();httpServer.close();});
  const created=await ack(host,'room:create',{nickname:'Host'});
  await ack(guest,'room:join',{code:created.code,nickname:'Guest'});
  const dup=await ack(imposter,'room:join',{code:created.code,nickname:'host'});
  assert.equal(dup.ok,false);
  assert.match(dup.error,/already taken/);

  await ack(host,'room:start',{});
  const room=rooms.get(created.code);
  const correctAns=room.currentQuestion.answer;
  const resultPromise=once(host,'game:question-result');
  // Both answer correctly with host answering first
  await ack(host,'game:answer',{answerIndex:correctAns});
  await new Promise(resolve=>setTimeout(resolve,10));
  await ack(guest,'game:answer',{answerIndex:correctAns});
  const [result]=await resultPromise;
  assert.equal(result.ranking.length,2);
  assert.equal(result.ranking[0].points,100);
  assert.equal(result.ranking[1].points,70);
});

test('Socket.IO integration: power-up activation and state reflection',async t=>{
  const httpServer=http.createServer();const io=new Server(httpServer);const {rooms}=attachGameSocket(io);
  await new Promise(resolve=>httpServer.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${httpServer.address().port}`;const host=await connectClient(url);const guest=await connectClient(url);
  t.after(()=>{host.disconnect();guest.disconnect();io.close();httpServer.close();});
  const created=await ack(host,'room:create',{nickname:'Host'});
  await ack(guest,'room:join',{code:created.code,nickname:'Guest'});
  await ack(host,'room:start',{});
  const room=rooms.get(created.code);
  // Ensure host has FREEZE_TIME and SHIELD for deterministic test
  room.players[0].powerups=['FREEZE_TIME','SHIELD'];
  room.players[0].usedPowerups=[];
  const statePromise=once(host,'game:state');
  const freezeRes=await ack(host,'game:powerup',{type:'FREEZE_TIME'});
  assert.equal(freezeRes.ok,true);
  const [updatedState]=await statePromise;
  assert.ok(updatedState.deadline > room.deadline);
  // Trying second power-up in same question is rejected
  const secondPower=await ack(host,'game:powerup',{type:'SHIELD'});
  assert.equal(secondPower.ok,false);
  assert.match(secondPower.error,/one power-up/);
});

test('Socket.IO integration: full match cycle completes all 28 questions to game:finished',async t=>{
  const httpServer=http.createServer();const io=new Server(httpServer);const {rooms}=attachGameSocket(io);
  await new Promise(resolve=>httpServer.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${httpServer.address().port}`;const host=await connectClient(url);const guest=await connectClient(url);
  t.after(()=>{host.disconnect();guest.disconnect();io.close();httpServer.close();});
  const created=await ack(host,'room:create',{nickname:'Host'});
  await ack(guest,'room:join',{code:created.code,nickname:'Guest'});
  await ack(host,'room:start',{});
  const room=rooms.get(created.code);
  const finishPromise=once(host,'game:finished');
  // Play through all 28 questions
  for(let i=0;i<28;i++){
    const ans=room.currentQuestion.answer;
    await ack(host,'game:answer',{answerIndex:ans});
    await ack(guest,'game:answer',{answerIndex:ans});
  }
  const [finished]=await finishPromise;
  assert.ok(finished);
  assert.equal(finished.rankings.length,2);
  assert.equal(room.status,'FINISHED');
});
