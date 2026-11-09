import { MAX_PLAYERS, MIN_PLAYERS, POWERUPS, BASE_POINTS, ROUND_QUESTIONS, ROUND_NAMES, QUESTION_SECONDS } from './constants.js';
import { QUESTION_BANK } from './questions.js';

export const makeRoomCode = (random = Math.random) => Array.from({length:6},()=> 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(random()*32)]).join('');
export const shuffle = (items, random = Math.random) => { const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
export function createRoom({hostId, nickname, avatar='🦊', random=Math.random}) {
  if (!nickname?.trim()) throw new Error('Nickname is required');
  return { code: makeRoomCode(random), hostId, status:'LOBBY', players:[{id:hostId,nickname:nickname.trim(),avatar,score:0,ready:true,answers:0,correct:0,powerups:shuffle(POWERUPS,random).slice(0,2),usedPowerups:[],shield:false,totalAnswerTime:0}], round:0, questionIndex:0, questions:[], currentQuestion:null, deadline:null, createdAt:Date.now() };
}
export function addPlayer(room,{id,nickname,avatar='🐸',random=Math.random}) {
  if(room.status!=='LOBBY') throw new Error('This match has already started');
  if(room.players.length>=MAX_PLAYERS) throw new Error('Room is full');
  if(!nickname?.trim()) throw new Error('Nickname is required');
  if(room.players.some(p=>p.nickname.toLowerCase()===nickname.trim().toLowerCase())) throw new Error('Nickname is already taken');
  room.players.push({id,nickname:nickname.trim(),avatar,score:0,ready:true,answers:0,correct:0,powerups:shuffle(POWERUPS,random).slice(0,2),usedPowerups:[],shield:false,totalAnswerTime:0});
  return room;
}
export function startMatch(room, random=Math.random) {
  if(room.status!=='LOBBY') throw new Error('Match cannot be started');
  if(room.players.length<MIN_PLAYERS) throw new Error('At least 2 players are required');
  room.questions=[shuffle(QUESTION_BANK.slice(0,5),random),shuffle(QUESTION_BANK.slice(5,10),random),shuffle(QUESTION_BANK.slice(10,15),random),shuffle(QUESTION_BANK.slice(15,23),random),shuffle(QUESTION_BANK.slice(23,28),random)].flat();
  room.status='PLAYING'; room.round=1; room.questionIndex=0;
  return openQuestion(room, Date.now());
}
export function openQuestion(room, now=Date.now()) {
  const round=room.round; const counts=ROUND_QUESTIONS;
  const before=counts.slice(0,round-1).reduce((a,b)=>a+b,0);
  const localIndex=room.questionIndex-before;
  const q=room.questions[room.questionIndex];
  if(!q){room.status='FINISHED';room.currentQuestion=null;room.deadline=null;return null;}
  room.currentQuestion={...q, roundName:ROUND_NAMES[round-1], round, questionNumber:localIndex+1, totalInRound:counts[round-1], seconds:QUESTION_SECONDS[round-1]};
  room.deadline=now+QUESTION_SECONDS[round-1]*1000;
  room.players.forEach(p=>{p.pendingAnswer=null;p.answerAt=null;p.doubleNext=false;p.personalDeadline=room.deadline;p.fiftyFifty=[];p.powerupUsedThisQuestion=false;});
  return room.currentQuestion;
}
export function activatePowerup(room, playerId, type, targetId, now = Date.now()) {
  const p=room.players.find(x=>x.id===playerId); if(!p) throw new Error('Player not found');
  if(room.status!=='PLAYING'||!room.currentQuestion) throw new Error('No active question');
  if(now > (p.personalDeadline ?? room.deadline)) throw new Error('Question time has expired');
  if(p.pendingAnswer!==null) throw new Error('Power-ups must be used before answering');
  if(p.powerupUsedThisQuestion) throw new Error('Only one power-up can be used per question');
  if(!p.powerups.includes(type)||p.usedPowerups.includes(type)) throw new Error('Power-up unavailable');
  if(p.usedPowerups.length>=2) throw new Error('No power-ups remaining');
  if(type==='POINT_STEAL'){
    const target=room.players.find(x=>x.id===targetId);
    if(!target||target.id===p.id) throw new Error('Choose a valid opponent');
    if(target.shield){target.shield=false;} else {const stolen=Math.min(30,target.score);target.score-=stolen;p.score+=stolen;}
  } else if(type==='SHIELD') p.shield=true;
  else if(type==='DOUBLE_TROUBLE') p.doubleNext=true;
  else if(type==='FREEZE_TIME') p.personalDeadline=(p.personalDeadline??room.deadline)+3000;
  else if(type==='FIFTY_FIFTY'){
    const wrong=room.currentQuestion.options.map((_,i)=>i).filter(i=>i!==room.currentQuestion.answer);
    p.fiftyFifty=shuffle(wrong).slice(0,2);
  }
  p.usedPowerups.push(type);p.powerupUsedThisQuestion=true; return {player:p,targetId};
}
export function submitAnswer(room, playerId, answerIndex, submittedAt=Date.now()) {
  const p=room.players.find(x=>x.id===playerId); if(!p) throw new Error('Player not found');
  if(room.status!=='PLAYING'||!room.currentQuestion) throw new Error('No active question');
  if(p.pendingAnswer!==null) throw new Error('Answer already submitted');
  if(submittedAt>(p.personalDeadline??room.deadline)) throw new Error('Answer time has expired');
  if(!Number.isInteger(answerIndex)||answerIndex<0||answerIndex>=room.currentQuestion.options.length) throw new Error('Invalid answer');
  p.pendingAnswer=answerIndex;p.answerAt=submittedAt;p.totalAnswerTime=(p.totalAnswerTime??0)+(submittedAt-(room.deadline-(room.currentQuestion.seconds*1000))); return {accepted:true};
}
export function resolveQuestion(room, now=Date.now()) {
  if(room.status!=='PLAYING'||!room.currentQuestion) throw new Error('No active question');
  if(room.players.some(p=>p.pendingAnswer===null && now<(p.personalDeadline??room.deadline))) throw new Error('Question is still open');
  const correct=room.players.filter(p=>p.pendingAnswer===room.currentQuestion.answer).sort((a,b)=>a.answerAt-b.answerAt);
  const ranked=[];let position=1;
  for(let i=0;i<correct.length;){
    let j=i+1;while(j<correct.length&&correct[j].answerAt===correct[i].answerAt)j++;
    const tied=correct.slice(i,j);const base=BASE_POINTS[Math.min(position-1,4)]*(room.round===5?2:1);
    tied.forEach(p=>{p.correct++;p.answers++;const points=base*(p.doubleNext?2:1);p.score+=points;ranked.push({playerId:p.id,nickname:p.nickname,position,points});});
    position+=tied.length;i=j;
  }
  room.players.filter(p=>p.pendingAnswer!==null&&p.pendingAnswer!==room.currentQuestion.answer).forEach(p=>p.answers++);
  const result={questionId:room.currentQuestion.id,correctAnswer:room.currentQuestion.answer,correctText:room.currentQuestion.options[room.currentQuestion.answer],ranking:ranked,scores:room.players.map(p=>({id:p.id,nickname:p.nickname,score:p.score}))};
  room.questionIndex++;
  const roundEnds=room.questionIndex===ROUND_QUESTIONS.slice(0,room.round).reduce((a,b)=>a+b,0);
  if(room.questionIndex>=28){room.status='FINISHED';room.currentQuestion=null;room.deadline=null;}
  else if(roundEnds){room.round++;openQuestion(room,now);}
  else openQuestion(room,now);
  return result;
}
export function finalResults(room) {
  const ranked=[...room.players].sort((a,b)=>b.score-a.score||b.correct-a.correct||a.totalAnswerTime-b.totalAnswerTime);
  const winner=ranked[0]; const tied=ranked.filter(p=>p.score===winner?.score&&p.correct===winner?.correct&&(p.totalAnswerTime??0)===(winner?.totalAnswerTime??0));
  return {rankings:ranked.map((p,i)=>({rank:i+1,id:p.id,nickname:p.nickname,avatar:p.avatar,score:p.score,correct:p.correct})),winners:tied.map(p=>p.id)};
}
