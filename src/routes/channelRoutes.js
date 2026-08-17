import express from 'express';
import Channel from '../models/Channel.js';
import Bundle from '../models/Bundle.js';
import User from '../models/User.js';
import Business from '../models/Business.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/env.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, contentType } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (contentType) filter.contentType = contentType;
    const channels = await Channel.find(filter).select('-streamUrl -sourceGroup').sort({ contentType: 1, channelNumber: 1, displayName: 1 });
    res.json({ channels });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load channels' }); }
});

router.get('/bundles', async (req, res) => {
  try {
    const bundles = await Bundle.find({ isActive: true });
    res.json({ bundles });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load bundles' }); }
});

router.get('/:id/stream', requireAuth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel || !channel.isActive) return res.status(404).json({ error: 'Channel not found' });
    if (channel.tier === 'free') return res.json({ streamUrl: channel.streamUrl });
    if (config.freeAccessMode) return res.json({ streamUrl: channel.streamUrl });
    let hasAccess = false;
    if (req.auth.type === 'user') {
      const user = await User.findById(req.auth.id);
      hasAccess = user?.unlockedBundles.includes(channel.bundleId);
    } else if (req.auth.type === 'business') {
      const business = await Business.findById(req.auth.id);
      hasAccess = business?.subscriptionActive && business.subscriptionBundles.includes(channel.bundleId) && business.currentBillingPeriodEnd && business.currentBillingPeriodEnd > new Date();
    }
    if (!hasAccess) return res.status(403).json({ error: 'This channel is locked. Unlock its bundle to watch.' });
    res.json({ streamUrl: channel.streamUrl });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch stream' }); }
});

export default router;
