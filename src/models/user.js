import mongoose from 'mongoose';
const { Schema } = mongoose;

export default mongoose.model('User', new Schema({ 
	userId: String,
    userName: String,
    role: Enumerator[user, admin], 
    email: String,
    password: String
}));