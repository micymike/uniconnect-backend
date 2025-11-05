import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

export const generateReferralCode = (username: string): string => {
  const cleanUsername = username.toLowerCase().replace(/\s/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${cleanUsername}${randomNum}`;
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateUniqueId = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

export const sanitizeUser = (user: any) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};