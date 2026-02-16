import mongoose from 'mongoose';
const { Schema } = mongoose;

export default mongoose.model('User', new Schema({ 
    userName: String,
    role: {
        type: String, 
        enum: ['user', 'admin']
    }, 
    email: String,
    password: String
}));