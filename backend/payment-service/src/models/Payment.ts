import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Payment document
export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  provider: 'stripe' | 'paypal';
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  transactionId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Main Payment schema
const PaymentSchema = new Schema<IPayment>({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking ID is required']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  provider: {
    type: String,
    enum: {
      values: ['stripe', 'paypal'],
      message: 'Provider must be either stripe or paypal'
    },
    required: [true, 'Payment provider is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative'],
    max: [100000, 'Amount cannot exceed $100,000'] // Reasonable upper limit
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD',
    uppercase: true,
    enum: {
      values: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      message: 'Currency must be one of: USD, EUR, GBP, CAD, AUD'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'succeeded', 'failed', 'refunded'],
      message: 'Status must be one of: pending, succeeded, failed, refunded'
    },
    default: 'pending'
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Transaction ID cannot exceed 100 characters']
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'payments'
});

// Indexes for performance optimization
PaymentSchema.index({ transactionId: 1 }, { unique: true });
PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ provider: 1 });
PaymentSchema.index({ createdAt: -1 }); // For sorting by date

// Compound indexes for common queries
PaymentSchema.index({ userId: 1, status: 1, createdAt: -1 });
PaymentSchema.index({ bookingId: 1, status: 1 });

// Virtual for formatted amount
PaymentSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Virtual for checking if payment is successful
PaymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'succeeded';
});

// Virtual for checking if payment is refundable
PaymentSchema.virtual('isRefundable').get(function() {
  return this.status === 'succeeded';
});

// Pre-save middleware to ensure transaction ID uniqueness
PaymentSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('transactionId')) {
    // Add provider prefix to transaction ID if not already present
    if (!this.transactionId.startsWith(`${this.provider}_`)) {
      this.transactionId = `${this.provider}_${this.transactionId}`;
    }
  }
  next();
});

// Ensure virtual fields are serialized
PaymentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Don't expose sensitive metadata in JSON responses
    if (ret.metadata && ret.metadata.sensitive) {
      delete ret.metadata.sensitive;
    }
    return ret;
  }
});

// Create and export the model
export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;