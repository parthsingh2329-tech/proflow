import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3001,
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};
