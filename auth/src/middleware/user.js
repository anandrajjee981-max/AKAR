import User from '../models/user.model.js'

export const getme= async(req,res,next)=>{
  const token = req.user
  if(!token){
    return res.status(401).json({message:"Unauthorized"})
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  try {
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      success: true,
      data: user
    });
res.user = user;
next();


  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }



}


