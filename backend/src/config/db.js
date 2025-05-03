const mongoose = require('mongoose');

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI); 
        console.log('mongoDB connected') 
    } catch (error) {
        console.error('MongoDB connection failed', error);
        process.exit(1);
    }
} 

module.exports = connectDb;