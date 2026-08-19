import express from 'express';
import crypto from 'crypto';
import Bundle from '../models/Bundle.js';
import User from '../models/User.js';
import Business from '../models/Business.js';
import Transaction from '../models/Transaction.js';
import { initOneTimeTransaction } from '../services/monnifyService.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/env.js';
const router = express.Router();

router.post('/unlock', requireAuth, async (req, res) => {
  try {
    if (req.auth.type !== 'user') return res.status(403).json({ error: 'Only individual users can purchase one-time unlocks' });
    const { bundleId } = req.body;
    const bundle = await Bundle.findOne({ bundleId, isActive: true });
    if (!bundle) return res.status(404).json({ error: 'Bundle not found' });
    const user = await User.findById(req.auth.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.unlockedBundles.includes(bundleId)) return res.status(409).json({ error: 'Bundle already unlocked' });
    const paymentReference = `unlock-${bundleId}-${user._id}-${crypto.randomUUID().slice(0, 8)}`;
    const transaction = await Transaction.create({ paymentReference, accountType: 'user', accountId: user._id, accountModelName: 'User', bundleId, amount: bundle.priceIndividual, purpose: 'individual_unlock', status: 'PENDING' });
    const monnifyResponse = await initOneTimeTransaction({ amount: bundle.priceIndividual, customerName: user.name, customerEmail: user.email, paymentReference, paymentDescription: `CipherStream unlock: ${bundle.name}`, redirectUrl: `${config.frontendUrl}/unlock/callback?ref=${paymentReference}` });
    res.json({ checkoutUrl: monnifyResponse.checkoutUrl, paymentReference, transactionId: transaction._id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to initiate unlock payment' }); }
});

router.post('/business/subscribe', requireAuth, async (req, res) => {
  try {
    if (req.auth.type !== 'business') return res.status(403).json({ error: 'Only business accounts can subscribe' });
    const { bundleIds } = req.body;
    if (!Array.isArray(bundleIds) || bundleIds.length === 0) return res.status(400).json({ error: 'bundleIds must be a non-empty array' });
    const bundles = await Bundle.find({ bundleId: { $in: bundleIds }, isActive: true });
    if (bundles.length !== bundleIds.length) return res.status(404).json({ error: 'One or more bundles not found' });
    const business = await Business.findById(req.auth.id);
    if (!business) return res.status(404).json({ error: 'Business not found' });
    const totalMonthly = bundles.reduce((sum, b) => sum + b.priceBusinessMonthly, 0);
    const paymentReference = `bizsub-${business._id}-${crypto.randomUUID().slice(0, 8)}`;
    const transaction = await Transaction.create({ paymentReference, accountType: 'business', accountId: business._id, accountModelName: 'Business', bundleId: bundleIds.join(','), amount: totalMonthly, purpose: 'business_subscription_payment', status: 'PENDING' });
    const monnifyResponse = await initOneTimeTransaction({ amount: totalMonthly, customerName: business.businessName, customerEmail: business.contactEmail, paymentReference, paymentDescription: `CipherStream Business subscription: ${bundleIds.join(', ')}`, redirectUrl: `${config.frontendUrl}/business/subscribe/callback?ref=${paymentReference}` });
    res.json({ checkoutUrl: monnifyResponse.checkoutUrl, paymentReference, transactionId: transaction._id, pendingBundles: bundleIds });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to initiate business subscription' }); }
});

export default router;
