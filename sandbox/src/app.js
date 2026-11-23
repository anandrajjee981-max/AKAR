import express from 'express';
import{v4 as uuidv4} from 'uuid';
const app = express();
import cookie from 'cookie-parser'
import { ensureK8s } from './kubernetes/config.js';
import {createpod, waitForPodReady} from './kubernetes/pod.js';
import {createservice, waitForServiceReachable} from './kubernetes/service.js';
import morgan from 'morgan';
import { createSandboxTTL } from './service/redis.js';
import router from './routes/sandbox.routes.js';
app.get('/api/sandbox/health', (req,res)=>{
    res.status(200).json({message: 'ok'})
})
app.use(morgan("dev"))
app.use(express.json())
app.use(cookie())
app.use('/api' , router)


export default app;
