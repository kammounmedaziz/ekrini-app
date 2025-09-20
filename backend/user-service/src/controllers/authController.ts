import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'changeme',
      { expiresIn: '7d' }
    );
    const userObj = user.toObject();
    delete (userObj as any).passwordHash;
    res.status(200).json({ token, user: userObj });
    return;
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error });
    return;
  }
};
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, profile } = req.body;

    // Basic validation
    if (!email || !password || !profile) {
      return res.status(400).json({ message: 'Email, password, and profile are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      email,
      passwordHash,
      profile
    });
    await user.save();

    // Respond (do not send passwordHash)
    const userObj = user.toObject();
    delete (userObj as any).passwordHash;
    res.status(201).json({ user: userObj });
    return;
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error });
    return;
  }
};
