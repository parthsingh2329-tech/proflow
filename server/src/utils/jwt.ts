import jwt from 'jsonwebtoken';
import { config } from '../config/env';

const JWT_SECRET = config.JWT_SECRET || 'supersecretjwtkeyforproflowenterprise123';
const JWT_REFRESH_SECRET = config.JWT_REFRESH_SECRET || 'supersecretjwtkeyforproflowrefresh123';

export const generateAccessToken = (payload: { userId: string; email: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: { userId: string }) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};
