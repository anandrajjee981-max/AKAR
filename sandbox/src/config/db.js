import mongoose from 'mongoose';

export async function connectdb() {
  try {
    const uri = process.env.SANDBOX_MONGO_URI;
    if (!uri) {
      console.error("❌ SANDBOX_MONGO_URI is not set in environment!");
      return;
    }
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ db connection error:", err.message);
  }
}



