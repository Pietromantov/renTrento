import mongoose from 'mongoose';
const { Schema } = mongoose;

export default mongoose.model('Product', new Schema({ 
    productId: String,
    productUserId: String,
    productName: String,
    category: String, 
    productInfo: String,
    productPrice: Number,
    status: Enumerator[available, unavailable, rented]
}));