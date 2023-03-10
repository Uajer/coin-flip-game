import mongoose from 'mongoose';

const connectDB = async () => {
  return await mongoose.connect((process.env as any).MONGODB_URI);
}

export default connectDB;