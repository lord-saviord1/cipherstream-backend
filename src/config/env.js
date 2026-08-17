import dotenv from 'dotenv';
dotenv.config();
function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) console.warn(`[config] Missing env var: ${name}`);
  return value;
}
export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET', 'dev_secret_change_me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  freeAccessMode: process.env.FREE_ACCESS_MODE !== 'false',
  monnify: {
    baseUrl: process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com',
    apiKey: required('MONNIFY_API_KEY'),
    secretKey: required('MONNIFY_SECRET_KEY'),
    contractCode: required('MONNIFY_CONTRACT_CODE'),
    walletAccountNumber: process.env.MONNIFY_WALLET_ACCOUNT_NUMBER,
  },
};
