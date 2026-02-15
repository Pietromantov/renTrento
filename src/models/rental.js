import mongoose from 'mongoose';
const { Schema } = mongoose;

export default mongoose.model('Rental', new Schema({ 
    rentalId: String,
    productId: String,
    renterId: String,
    clientId: String, 
    startDate: Date,
    endDate: Date,
    rentalPrice: Number,
    status: Enumerator[active,not_active,finished]
}));