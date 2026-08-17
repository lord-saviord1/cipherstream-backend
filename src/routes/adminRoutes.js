import express from 'express';
// Kept as a manual re-seed trigger if ever needed — real content now lives
// in src/utils/seedChannels.js (run via `npm run seed`, not this endpoint).
// This route now just re-runs that same seed on demand.
import { execSeed } from '../utils/seedChannels.js';

const router = express.Router();
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

export default router;
