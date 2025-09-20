import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Car document
export interface ICar extends Document {
  title: string;
  category: 'sedan' | 'suv' | 'hatchback' | 'luxury' | 'van';
  features: string[];
  pricePerDay: number;
  location: {
    city: string;
    address: string;
  };
  availability: boolean;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Location subdocument schema
const LocationSchema = new Schema({
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  }
}, { _id: false });

// Main Car schema
const CarSchema = new Schema<ICar>({
  title: {
    type: String,
    required: [true, 'Car title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Car category is required'],
    enum: {
      values: ['sedan', 'suv', 'hatchback', 'luxury', 'van'],
      message: 'Category must be one of: sedan, suv, hatchback, luxury, van'
    }
  },
  features: {
    type: [String],
    default: [],
    validate: {
      validator: function(features: string[]) {
        return features.length <= 20; // Maximum 20 features
      },
      message: 'Cannot have more than 20 features'
    }
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Price per day is required'],
    min: [1, 'Price per day must be at least $1'],
    max: [10000, 'Price per day cannot exceed $10,000']
  },
  location: {
    type: LocationSchema,
    required: [true, 'Location information is required']
  },
  availability: {
    type: Boolean,
    default: true
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(images: string[]) {
        return images.length <= 10; // Maximum 10 images
      },
      message: 'Cannot have more than 10 images'
    }
  }
}, {
  timestamps: true,
  collection: 'cars'
});

// Indexes for performance optimization
CarSchema.index({ category: 1 });
CarSchema.index({ 'location.city': 1 });
CarSchema.index({ pricePerDay: 1 });
CarSchema.index({ availability: 1 });
CarSchema.index({ category: 1, 'location.city': 1, pricePerDay: 1 }); // Compound index for common queries

// Text index for search functionality
CarSchema.index({ title: 'text', features: 'text' });

// Virtual for formatted price
CarSchema.virtual('formattedPrice').get(function() {
  return `$${this.pricePerDay}/day`;
});

// Ensure virtual fields are serialized
CarSchema.set('toJSON', {
  virtuals: true
});

// Create and export the model
export const Car = mongoose.model<ICar>('Car', CarSchema);

export default Car;