// Starter bank. Expand with reviewed, original questions before public launch.
export const QUESTION_BANK = [
  { id:'q01', category:'general', type:'mcq', prompt:'Which planet is known as the Red Planet?', options:['Venus','Mars','Jupiter','Mercury'], answer:1 },
  { id:'q02', category:'general', type:'mcq', prompt:'What is the capital of Japan?', options:['Seoul','Beijing','Tokyo','Bangkok'], answer:2 },
  { id:'q03', category:'science', type:'mcq', prompt:'What gas do plants absorb?', options:['Oxygen','Carbon dioxide','Nitrogen','Helium'], answer:1 },
  { id:'q04', category:'technology', type:'mcq', prompt:'What does CPU stand for?', options:['Central Processing Unit','Computer Power Utility','Core Program Upload','Central Program User'], answer:0 },
  { id:'q05', category:'general', type:'mcq', prompt:'How many sides does a hexagon have?', options:['5','6','7','8'], answer:1 },
  { id:'q06', category:'meme', type:'mcq', prompt:'When the Wi-Fi stops during an online exam, the mood is…', options:['Peaceful','Main character energy','Instant panic','Time to sleep'], answer:2 },
  { id:'q07', category:'meme', type:'mcq', prompt:'Your friend says “I am 5 minutes away” but has not left home. This is…', options:['Quantum travel','Friendship maths','A weather update','A speedrun'], answer:1 },
  { id:'q08', category:'meme', type:'mcq', prompt:'The most suspicious phrase in a group project?', options:['I made a doc','Let us divide work','I will do it later','Submitted!'], answer:2 },
  { id:'q09', category:'meme', type:'mcq', prompt:'When someone says “I know a shortcut” and opens 47 tabs, what happened?', options:['Productivity','A side quest','A software update','Nothing unusual'], answer:1 },
  { id:'q10', category:'meme', type:'mcq', prompt:'Your laptop fan sounds like it is preparing for take-off. You should…', options:['Give it a boarding pass','Check what is running','Ask for a runway','Clap for it'], answer:1 },
  { id:'q11', category:'logic', type:'mcq', prompt:'Which is heavier: 1 kg of steel or 1 kg of cotton?', options:['Steel','Cotton','Same weight','Cannot tell'], answer:2 },
  { id:'q12', category:'logic', type:'mcq', prompt:'If yesterday was Monday, what day is tomorrow?', options:['Tuesday','Wednesday','Thursday','Sunday'], answer:1 },
  { id:'q13', category:'logic', type:'mcq', prompt:'What comes next: 2, 4, 8, 16, …?', options:['18','24','32','36'], answer:2 },
  { id:'q14', category:'logic', type:'mcq', prompt:'A farmer has 10 sheep. All but 3 run away. How many remain?', options:['3','7','10','0'], answer:0 },
  { id:'q15', category:'logic', type:'mcq', prompt:'If you overtake the person in second place, what position are you in?', options:['1st','2nd','3rd','Last'], answer:1 },
  ...Array.from({length:8}, (_,i)=>({id:`q${String(i+16).padStart(2,'0')}`,category:'truefalse',type:'boolean',prompt:[
    'Lightning is hotter than the surface of the Sun.','Octopuses have three hearts.','The Great Wall of China is clearly visible from the Moon with the naked eye.','Sound travels faster in water than in air.','A day on Venus is longer than its year.','Bats are blind.','Humans have four lungs.','Sharks are mammals.'
  ][i],options:['True','False'],answer:[0,0,1,0,0,1,1,1][i]})),
  {id:'q24',category:'technology',type:'mcq',prompt:'Which data structure follows FIFO?',options:['Stack','Queue','Tree','Graph'],answer:1},
  {id:'q25',category:'science',type:'mcq',prompt:'What is the nearest star to Earth?',options:['Sirius','Proxima Centauri','The Sun','Polaris'],answer:2},
  {id:'q26',category:'technology',type:'mcq',prompt:'What does URL stand for?',options:['Uniform Resource Locator','Universal Runtime Link','User Routing List','Unified Reference Language'],answer:0},
  {id:'q27',category:'general',type:'mcq',prompt:'Which ocean is the largest?',options:['Atlantic','Indian','Arctic','Pacific'],answer:3},
  {id:'q28',category:'technology',type:'mcq',prompt:'Which of these is an asymmetric encryption algorithm?',options:['AES','ChaCha20','RSA','SHA-256'],answer:2}
];
