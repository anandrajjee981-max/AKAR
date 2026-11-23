import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
const router = express.Router();
import { googleAuthCallback, verifyGoogleToken ,googleauth} from "../controller/user.contoller.js";

router.get("/google", googleauth);
router.get("/google/callback", passport.authenticate("google", { session: false }), googleAuthCallback);
router.post("/verify-google-token", verifyGoogleToken);

router.get("/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.slice(7) 
      : (req.cookies?.token || req.query?.token);

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ success: true, user: decoded });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
});

export default router; 
