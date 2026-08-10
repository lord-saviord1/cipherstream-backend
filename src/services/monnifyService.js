import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env.js';

const { baseUrl, apiKey, secretKey, contractCode } = config.monnify;

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const basicAuth = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
  const { data } = await axios.post(
    `${baseUrl}/api/v1/auth/login`,
    {},
    { headers: { Authorization: `Basic ${basicAuth}` } }
  );
  if (!data?.requestSuccessful) {
    throw new Error(`Monnify auth failed: ${data?.responseMessage || 'unknown error'}`);
  }
  cachedToken = data.responseBody.accessToken;
  tokenExpiresAt = Date.now() + (data.responseBody.expiresIn - 60) * 1000;
  return cachedToken;
}

async function authedClient() {
  const token = await getAccessToken();
  return axios.create({ baseURL: baseUrl, headers: { Authorization: `Bearer ${token}` } });
}

export async function initOneTimeTransaction({ amount, customerName, customerEmail, paymentReference, paymentDescription, redirectUrl, splitConfig }) {
  const client = await authedClient();
  const payload = {
    amount, customerName, customerEmail, paymentReference, paymentDescription,
    currencyCode: 'NGN', contractCode, redirectUrl,
    paymentMethods: ['CARD', 'ACCOUNT_TRANSFER', 'USSD'],
  };
  if (splitConfig && splitConfig.length > 0) payload.incomeSplitConfig = splitConfig;
  const { data } = await client.post('/api/v1/merchant/transactions/init-transaction', payload);
  if (!data?.requestSuccessful) throw new Error(`Monnify init transaction failed: ${data?.responseMessage}`);
  return data.responseBody;
}

export async function createReservedAccount({ accountReference, accountName, customerName, customerEmail, bvn, getAllAvailableBanks = true, incomeSplitConfig = [], restrictPaymentSource }) {
  const client = await authedClient();
  const payload = { accountReference, accountName, currencyCode: 'NGN', contractCode, customerEmail, customerName, getAllAvailableBanks };
  if (bvn) payload.bvn = bvn;
  if (incomeSplitConfig.length > 0) payload.incomeSplitConfig = incomeSplitConfig;
  if (restrictPaymentSource) payload.restrictPaymentSource = restrictPaymentSource;
  const { data } = await client.post('/api/v2/bank-transfer/reserved-accounts', payload);
  if (!data?.requestSuccessful) throw new Error(`Monnify reserved account creation failed: ${data?.responseMessage}`);
  return data.responseBody;
}

export async function verifyTransaction(paymentReference) {
  const client = await authedClient();
  const { data } = await client.get(`/api/v1/merchant/transactions/query?paymentReference=${encodeURIComponent(paymentReference)}`);
  if (!data?.requestSuccessful) throw new Error(`Monnify verify failed: ${data?.responseMessage}`);
  return data.responseBody;
}

export async function initiateDisbursement({ reference, amount, narration, destinationBankCode, destinationAccountNumber, currency = 'NGN' }) {
  const client = await authedClient();
  const payload = { amount, reference, narration, destinationBankCode, destinationAccountNumber, currency, sourceAccountNumber: config.monnify.walletAccountNumber };
  const { data } = await client.post('/api/v2/disbursements/single', payload);
  if (!data?.requestSuccessful) throw new Error(`Monnify disbursement failed: ${data?.responseMessage}`);
  return data.responseBody;
}

export async function nameEnquiry({ accountNumber, bankCode }) {
  const client = await authedClient();
  const { data } = await client.get(`/api/v1/disbursements/account/validate?accountNumber=${accountNumber}&bankCode=${bankCode}`);
  if (!data?.requestSuccessful) throw new Error(`Monnify name enquiry failed: ${data?.responseMessage}`);
  return data.responseBody;
}

export function verifyWebhookSignature(rawBody, signatureHeader) {
  const computedHash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
  return computedHash === signatureHeader;
}
