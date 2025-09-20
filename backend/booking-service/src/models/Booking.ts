import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  carId: mongoose.Types.ObjectId;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  paymentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Main Booking schema
const BookingSchema = new Schema<IBooking>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  carId: {
    type: Schema.Types.ObjectId,
    ref: 'Car',
    required: [true, 'Car ID is required']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
      message: 'Status must be one of: pending, confirmed, active, completed, cancelled'
    },
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    validate: {
      validator: function(startDate: Date) {
        // Start date must be in the future (at least 1 hour from now)
        const oneHourFromNow = new Date();
        oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
        return startDate >= oneHourFromNow;
      },
      message: 'Start date must be at least 1 hour in the future'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(this: IBooking, endDate: Date) {
        // End date must be after start date
        return endDate > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: false
  }
}, {
  timestamps: true,
  collection: 'bookings'
});

// Indexes for performance optimization and conflict checking
BookingSchema.index({ userId: 1 });
BookingSchema.index({ carId: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ startDate: 1, endDate: 1 });

// Compound index for checking booking conflicts
BookingSchema.index({ 
  carId: 1, 
  startDate: 1, 
  endDate: 1 
}, { 
  name: 'booking_conflict_check' 
});

// Index for date range queries
BookingSchema.index({ carId: 1, status: 1, startDate: 1, endDate: 1 });

// Virtual for booking duration in days
BookingSchema.virtual('durationDays').get(function() {
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for checking if booking is active
BookingSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now;
});

// Pre-save middleware to validate booking conflicts
BookingSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('startDate') || this.isModified('endDate') || this.isModified('carId')) {
    // Check for overlapping bookings for the same car
    const overlappingBooking = await mongoose.model('Booking').findOne({
      carId: this.carId,
      _id: { $ne: this._id }, // Exclude current booking
      status: { $in: ['confirmed', 'active'] }, // Only check confirmed and active bookings
      $or: [
        {
          startDate: { $lt: this.endDate },
          endDate: { $gt: this.startDate }
        }
      ]
    });

    if (overlappingBooking) {
      const error = new Error('Car is not available for the selected dates');
      return next(error);
    }
  }
  next();
});

// Ensure virtual fields are serialized
BookingSchema.set('toJSON', {
  virtuals: true
});

// Create and export the model
export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;