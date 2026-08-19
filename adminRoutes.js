import express from 'express';
import Channel from '../models/Channel.js';
import Bundle from '../models/Bundle.js';
import AdminUser from '../models/AdminUser.js';
import { execSeed } from '../utils/seedChannels.js';
import { signAdminToken, requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Kept for one-off bulk reseeds if ever needed — day-to-day channel
// management should go through the routes below instead.
const SEED_KEY = 'cs-seed-2c9f14';
router.get('/seed', async (req, res) => {
  try {
    if (req.query.key !== SEED_KEY) return res.status(401).json({ error: 'Invalid seed key' });
    const result = await execSeed();
    res.json({ seeded: true, ...result });
  } catch (err) {
    console.error('[admin/seed] Failed:', err);
    res.status(500).json({ error: 'Seed failed', detail: err.message });
  }
});

/**
 * Admin login. There's no public signup route for this on purpose —
 * admin accounts are created via POST /api/admin/bootstrap once, using
 * the same SEED_KEY as a one-time gate, then that route should be
 * removed/disabled.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await AdminUser.findOne({ email: email?.toLowerCase() });
    if (!admin || !(await admin.checkPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signAdminToken({ id: admin._id.toString() });
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

/**
 * One-time bootstrap to create the first admin account(s) — gated by the
 * same SEED_KEY so it's not wide open. Use this once for you and your
 * teammate, then treat it as done (doesn't need to be removed, since it's
 * key-gated the same as /seed, but you could lock it down further later).
 */
router.post('/bootstrap', async (req, res) => {
  try {
    if (req.query.key !== SEED_KEY) return res.status(401).json({ error: 'Invalid seed key' });
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    const existing = await AdminUser.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Admin already exists with that email' });
    const admin = new AdminUser({ name, email });
    await admin.setPassword(password);
    await admin.save();
    res.status(201).json({ created: true, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bootstrap failed' });
  }
});

// ---- Channel management (all require an admin token) ----

router.get('/channels', requireAdmin, async (req, res) => {
  try {
    const channels = await Channel.find({}).sort({ contentType: 1, channelNumber: 1, displayName: 1 });
    res.json({ channels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load channels' });
  }
});

router.post('/channels', requireAdmin, async (req, res) => {
  try {
    const channel = new Channel(req.body);
    await channel.save();
    res.status(201).json({ channel });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to create channel' });
  }
});

router.patch('/channels/:id', requireAdmin, async (req, res) => {
  try {
    const channel = await Channel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json({ channel });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to update channel' });
  }
});

// Deactivate, not delete — keeps history, and the public /api/channels
// route already filters on isActive so this instantly hides it.
router.patch('/channels/:id/deactivate', requireAdmin, async (req, res) => {
  try {
    const channel = await Channel.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json({ channel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate channel' });
  }
});

router.patch('/channels/:id/reactivate', requireAdmin, async (req, res) => {
  try {
    const channel = await Channel.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json({ channel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reactivate channel' });
  }
});

router.delete('/channels/:id', requireAdmin, async (req, res) => {
  try {
    const channel = await Channel.findByIdAndDelete(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

router.get('/bundles', requireAdmin, async (req, res) => {
  try {
    const bundles = await Bundle.find({});
    res.json({ bundles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load bundles' });
  }
});

export default router;
