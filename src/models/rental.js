import mongoose from 'mongoose';
const { Schema } = mongoose;

export default mongoose.model('Rental', new Schema({ 
    productId: String,
    renterId: String,
    clientId: String, 
    startDate: Date,
    endDate: Date,
    rentalPrice: Number,
    status: {
        type: String,
        enum: ['active','not_active','finished']
    }
}));