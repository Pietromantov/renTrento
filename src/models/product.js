import mongoose from 'mongoose';
const { Schema } = mongoose;

export default mongoose.model('Product', new Schema({ 
    productUserId: String,
    productUserName: String,
    productName: String,
    category: String, 
    productInfo: String,
    productPrice: Number,
    pickUpPoint: String,
    status: {
        type: String,
        enum: ['available', 'unavailable', 'rented']
    }
}));