import mongoose from 'mongoose';
const { Schema } = mongoose;

export default mongoose.model('Product', new Schema({ 
    productUserId: String, //cambiare in productUserName anche in api
    productName: String,
    category: String, 
    productInfo: String,
    productPrice: Number,
    status: {
        type: String,
        enum: ['available', 'unavailable', 'rented']
    }
}));