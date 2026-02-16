import mongoose from 'mongoose';
const { Schema } = mongoose;

export default mongoose.model('Category', new Schema({ 
    categoryName: String
}));