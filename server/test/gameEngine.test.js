import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, addPlayer, startMatch, submitAnswer, resolveQuestion, activatePowerup, finalResults } from '../src/engine/gameEngine.js';

test('room creation generates a six-character private code and gives host two random power-ups',()=>{
  const room=createRoom({hostId:'p1',nickname:'Host',random:()=>0});
  assert.equal(room.code.length,6); assert.equal(room.players[0].powerups.length,2); assert.equal(room.status,'LOBBY');
});
test('room enforces unique nicknames and eight-player maximum',()=>{
  const room=createRoom({hostId:'p1',nickname:'Host'});
  assert.throws(()=>addPlayer(room,{id:'p2',nickname:'host'}),/already taken/);
  for(let i=2;i<=8;i++) addPlayer(room,{id:`p${i}`,nickname:`Player ${i}`});
  assert.throws(()=>addPlayer(room,{id:'p9',nickname:'Player 9'}),/full/);
});
test('match requires two players and loads 28 randomized questions',()=>{
  const room=createRoom({hostId:'p1',nickname:'Host'});
  assert.throws(()=>startMatch(room),/At least 2/);
  addPlayer(room,{id:'p2',nickname:'Guest'}); startMatch(room,()=>0.5);
  assert.equal(room.questions.length,28); assert.equal(room.round,1); assert.equal(room.status,'PLAYING');
  assert.equal(room.questions.slice(0,5).length,5);assert.ok(room.questions.slice(5,10).every(q=>q.category==='meme'));assert.ok(room.questions.slice(10,15).every(q=>q.category==='logic'));assert.ok(room.questions.slice(15,23).every(q=>q.category==='truefalse'));assert.ok(room.questions.slice(23,28).every(q=>['science','technology','general'].includes(q.category)));
});
test('answers are accepted once and correct players receive speed-ranked points',()=>{
  const room=createRoom({hostId:'p1',nickname:'Host'}); addPlayer(room,{id:'p2',nickname:'Guest'}); startMatch(room,()=>0.5);
  const answer=room.currentQuestion.answer, start=room.deadline-room.currentQuestion.seconds*1000;
  submitAnswer(room,'p1',answer,start+100); submitAnswer(room,'p2',answer,start+200);
  assert.throws(()=>submitAnswer(room,'p1',answer,start+250),/already submitted/);
  const result=resolveQuestion(room,start+300);
  assert.equal(result.ranking[0].points,100); assert.equal(result.ranking[1].points,70);
});
test('late and invalid answers are rejected',()=>{
  const room=createRoom({hostId:'p1',nickname:'Host'}); addPlayer(room,{id:'p2',nickname:'Guest'}); startMatch(room);
  assert.throws(()=>submitAnswer(room,'p1',99,Date.now()),/Invalid answer/);
  assert.throws(()=>submitAnswer(room,'p1',0,room.deadline+1),/expired/);
});
test('Final Showdown doubles rank points',()=>{
  const room=createRoom({hostId:'p1',nickname:'Host'}); addPlayer(room,{id:'p2',nickname:'Guest'}); startMatch(room);
  room.round=5; room.questionIndex=23; room.currentQuestion={...room.questions[23],round:5,seconds:12}; room.deadline=Date.now()+12000;
  room.players.forEach(p=>{p.pendingAnswer=null;p.personalDeadline=room.deadline;});
  const start=room.deadline-12000, a=room.currentQuestion.answer;
  submitAnswer(room,'p1',a,start+100); submitAnswer(room,'p2',a,start+200);
  const result=resolveQuestion(room,start+300);
  assert.equal(result.ranking[0].points,200); assert.equal(result.ranking[1].points,140);
});
test('point steal transfers at most 30 points and shield blocks it',()=>{
  const room=createRoom({hostId:'p1',nickname:'Host'}); addPlayer(room,{id:'p2',nickname:'Guest'}); startMatch(room);
  room.players[1].score=20; room.players[0].powerups=['POINT_STEAL'];
  activatePowerup(room,'p1','POINT_STEAL','p2'); assert.equal(room.players[1].score,0); assert.equal(room.players[0].score,20);
  room.players[1].score=60; room.players[1].shield=true; room.players[0].usedPowerups=[]; room.players[0].powerupUsedThisQuestion=false;
  activatePowerup(room,'p1','POINT_STEAL','p2'); assert.equal(room.players[1].score,60); assert.equal(room.players[0].score,20);
});
test('freeze time adds three seconds to that player only',()=>{
  const room=createRoom({hostId:'p1',nickname:'Host'}); addPlayer(room,{id:'p2',nickname:'Guest'}); startMatch(room);
  room.players[0].powerups=['FREEZE_TIME']; const deadline=room.deadline;
  activatePowerup(room,'p1','FREEZE_TIME'); assert.equal(room.players[0].personalDeadline,deadline+3000); assert.equal(room.deadline,deadline);
});
test('final results rank by score and return champion',()=>{
  const room=createRoom({hostId:'p1',nickname:'Host'}); addPlayer(room,{id:'p2',nickname:'Guest'});
  room.players[0].score=100; room.players[1].score=70;
  assert.deepEqual(finalResults(room).winners,['p1']);
});

test('equal answer timestamps share rank points and skip the next place',()=>{
  const room=createRoom({hostId:'p1',nickname:'Host'}); addPlayer(room,{id:'p2',nickname:'Guest'}); addPlayer(room,{id:'p3',nickname:'Third'}); startMatch(room,()=>0.4);
  const start=room.deadline-room.currentQuestion.seconds*1000,answer=room.currentQuestion.answer;
  submitAnswer(room,'p1',answer,start+100);submitAnswer(room,'p2',answer,start+100);submitAnswer(room,'p3',answer,start+200);
  const result=resolveQuestion(room,start+300);
  assert.deepEqual(result.ranking.map(x=>[x.position,x.points]),[[1,100],[1,100],[3,50]]);
});
test('only one power-up can be used per question',()=>{
  const room=createRoom({hostId:'p1',nickname:'Host'});addPlayer(room,{id:'p2',nickname:'Guest'});startMatch(room);
  room.players[0].powerups=['SHIELD','DOUBLE_TROUBLE'];
  activatePowerup(room,'p1','SHIELD');
  assert.throws(()=>activatePowerup(room,'p1','DOUBLE_TROUBLE'),/one power-up/);
});
test('Freeze Time gives that player three extra seconds to answer',()=>{
  const room=createRoom({hostId:'p1',nickname:'Host'});addPlayer(room,{id:'p2',nickname:'Guest'});startMatch(room);
  room.players[0].powerups=['FREEZE_TIME'];const start=room.deadline-room.currentQuestion.seconds*1000;
  activatePowerup(room,'p1','FREEZE_TIME');
  assert.throws(()=>submitAnswer(room,'p2',room.currentQuestion.answer,room.deadline+2000),/expired/);
  assert.throws(()=>resolveQuestion(room,room.deadline+1000),/still open/);
  assert.doesNotThrow(()=>submitAnswer(room,'p1',room.currentQuestion.answer,room.deadline+2000));
  assert.doesNotThrow(()=>resolveQuestion(room,room.deadline+3100));
});
