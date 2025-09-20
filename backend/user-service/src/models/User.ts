import mongoose, { Document, Schema } from 'mongoose';
import validator from 'validator';

// TypeScript interface for User document
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'customer' | 'admin';
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    driverLicense: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Profile subdocument schema
const ProfileSchema = new Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(phone: string) {
        // Basic phone validation - accepts formats like +1234567890, (123) 456-7890, etc.
        return validator.isMobilePhone(phone, 'any');
      },
      message: 'Please provide a valid phone number'
    }
  },
  driverLicense: {
    type: String,
    required: [true, 'Driver license is required'],
    trim: true,
    maxlength: [20, 'Driver license cannot exceed 20 characters']
  }
}, { _id: false });

// Main User schema
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (str: string) => validator.isEmail(str),
      message: 'Please provide a valid email address'
    }
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [60, 'Password hash must be at least 60 characters (bcrypt hash)']
  },
  role: {
    type: String,
    enum: {
      values: ['customer', 'admin'],
      message: 'Role must be either customer or admin'
    },
    default: 'customer'
  },
  profile: {
    type: ProfileSchema,
    required: [true, 'Profile information is required']
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for performance optimization
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ 'profile.phone': 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function(this: IUser) {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
  if (ret.passwordHash) delete (ret as any)['passwordHash']; // Never return password hash
    return ret;
  }
});

// Create and export the model
export const User = mongoose.model<IUser>('User', UserSchema);

export default User;