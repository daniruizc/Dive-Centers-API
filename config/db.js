import mongoose from 'mongoose';

export default async () => {
    const uri = process.env.NODE_ENV === 'test' ? process.env.TEST_MONGO_URI : process.env.MONGO_URI;
    const conn = await mongoose.connect(uri);

    console.log(`MongoDB Connected: ${uri}`.cyan.bold);
}