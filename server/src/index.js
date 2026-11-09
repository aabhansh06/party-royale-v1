import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
dotenv.config({path:path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../.env')});
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { attachGameSocket } from './sockets/gameSocket.js';

const app=express(); app.use(cors({origin:process.env.CLIENT_ORIGIN||'http://localhost:5173'})); app.use(express.json());
app.get('/health',(_,res)=>res.json({status:'ok',service:'party-royale-server',version:'1.0.0'}));
const server=http.createServer(app); const io=new Server(server,{cors:{origin:process.env.CLIENT_ORIGIN||'http://localhost:5173',methods:['GET','POST']}});
attachGameSocket(io);
const port=Number(process.env.PORT||4000);
if(process.env.MONGODB_URI){mongoose.connect(process.env.MONGODB_URI).then(()=>console.log('MongoDB connected')).catch(err=>console.warn('MongoDB unavailable; using in-memory rooms for this development run:',err.message));}
server.listen(port,()=>console.log(`Party Royale server listening on ${port}`));
