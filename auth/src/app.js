import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cookie from 'cookie-parser';
import router from './routes/user.routes.js';
dotenv.config();
import passport from 'passport';
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(cookie());
app.use(passport.initialize());
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 3000}/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
    // Handle user authentication and profile information here
    return done(null, profile);
}));    

app.use("/auth", router)



export default app;