import express from "express";
import passport from "passport";
const router = express.Router();
import { googleAuthCallback, verifyGoogleToken } from "../controller/user.contoller.js";
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false }), googleAuthCallback);

router.post("/verify-google-token", verifyGoogleToken);

export default router;
