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
  assert.equal(result.questionId,'q01');
});
