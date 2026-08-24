import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export const generateAccessToken = (payload: { userId: string; email: string }) => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: { userId: string }) => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): any => {
  return jwt.verify(token, config.JWT_SECRET);
};

export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
};
