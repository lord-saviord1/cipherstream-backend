import express from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Business from '../models/Business.js';
import { verifyWebhookSignature } from '../services/monnifyService.js';
const router = express.Router();

router.post('/monnify', async (req, res) => {
  try {
    const signature = req.headers['monnify-signature'];
    const rawBody = req.rawBody;
    if (!signature || !verifyWebhookSignature(rawBody, signature)) return res.status(401).json({ error: 'Invalid signature' });
    const event = JSON.parse(rawBody.toString('utf8'));
    const { eventType, eventData } = event;
    if (eventType !== 'SUCCESSFUL_TRANSACTION') return res.status(200).json({ received: true, ignored: eventType });
    const paymentReference = eventData.paymentReference;
    const transaction = await Transaction.findOne({ paymentReference });
    if (!transaction) return res.status(200).json({ received: true, matched: false });
    if (transaction.status === 'PAID') return res.status(200).json({ received: true, alreadyProcessed: true });
    transaction.status = 'PAID';
    transaction.transactionReference = eventData.transactionReference;
    transaction.rawWebhookPayload = event;
    await transaction.save();
    if (transaction.purpose === 'individual_unlock') {
      await User.findByIdAndUpdate(transaction.accountId, { $addToSet: { unlockedBundles: transaction.bundleId } });
    } else if (transaction.purpose === 'business_subscription_payment') {
      const bundleIds = transaction.bundleId.split(',');
      const periodEnd = new Date(); periodEnd.setMonth(periodEnd.getMonth() + 1);
      await Business.findByIdAndUpdate(transaction.accountId, { subscriptionActive: true, $addToSet: { subscriptionBundles: { $each: bundleIds } }, currentBillingPeriodEnd: periodEnd });
    }
    res.status(200).json({ received: true, processed: true });
  } catch (err) { console.error('[webhook] error:', err); res.status(200).json({ received: true, error: 'processing_failed' }); }
});

export default router;
