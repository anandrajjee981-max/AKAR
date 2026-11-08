import User from '../models/user.model.js'
import jwt from "jsonwebtoken";

export const generateToken = (user) => {
    const payload = {
        id: user._id || user.id,
        email: user.email || user.emails?.[0]?.value,
        name: user.name || user.displayName
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
}   

export const googleAuthCallback = async (req, res) => {
    const userProfile = req.user;
    if (!userProfile) {
        return res.status(401).json({ message: "Google authentication failed" });
    }

    const token = generateToken(userProfile);
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });
    return res.json({ token });
}

export const registerUser = async (req, res) => {
    const { email, name, password } = req.body;
   const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }
    const newUser = new User({ email, name, password });
    try {
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }

}

export async function verifyGoogleToken(req, res) {
  try {
    const { token, accessToken, role } = req.body;
    const tokenToVerify = token || accessToken;

    if (!tokenToVerify) {
      return res.status(400).json({
        success: false,
        message: "Google credential / token is required"
      });
    }

    let email = null;
    let name = null;
    let googleId = null;

    // Check if token is a JWT ID token (3 segments separated by dots) or access token
    if (typeof tokenToVerify === 'string' && tokenToVerify.split('.').length === 3) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: tokenToVerify,
          audience: Config.CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (payload) {
          email = payload.email;
          name = payload.name;
          googleId = payload.sub;
        }
      } catch (idErr) {
        console.warn("verifyIdToken failed, trying userinfo endpoint:", idErr.message);
      }
    }

    // If ID token verification was not applicable or failed, verify via Google UserInfo API
    if (!email) {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenToVerify}` }
      });
      if (response.ok) {
        const userInfo = await response.json();
        email = userInfo.email;
        name = userInfo.name;
        googleId = userInfo.sub;
      }
    }

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Failed to verify Google token"
      });
    }

    // Find or create user
    let user = await usermodel.findOne({ email });
    if (!user) {
      const assignedRole = role === "seller" ? "seller" : "buyer";
      user = new usermodel({
        username: name || email.split('@')[0],
        email: email,
        role: assignedRole
      });
      await user.save();
    }

    const appToken = await generateToken(user, res);

    return res.status(200).json({
      success: true,
      message: "Google authentication successful",
      token: appToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Google token verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during Google verification"
    });
  }
}
