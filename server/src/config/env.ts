import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3001,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_EjZ2Id6zDeuM@ep-bold-cloud-axx6sx2o.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkeyforproflowenterprise123',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'supersecretjwtkeyforproflowrefresh123',
  CLIENT_URL: process.env.CLIENT_URL || '*',
};
