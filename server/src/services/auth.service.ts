import prisma from '../config/db';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

export const register = async (data: any) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  const hashedPassword = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
    },
    select: { id: true, name: true, email: true, globalRole: true, avatar: true },
  });

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id });

  return { user, accessToken, refreshToken };
};

export const login = async (data: any) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValidPassword = await comparePassword(data.password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id });

  const { passwordHash, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessToken, refreshToken };
};

export const refreshToken = async (token: string) => {
  try {
    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw new AppError('User not found', 404);

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    return { accessToken };
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, globalRole: true, avatar: true, createdAt: true },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};
