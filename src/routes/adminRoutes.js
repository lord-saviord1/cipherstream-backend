import express from 'express';
import Bundle from '../models/Bundle.js';
import Channel from '../models/Channel.js';

const router = express.Router();

// Temporary, one-off seed trigger — protected by a query key so random
// visitors can't wipe/reseed the catalog. Remove this route once real
// content management exists.
const SEED_KEY = 'cs-seed-2c9f14';

const bundles = [
  { bundleId: 'sports-pack', name: 'Sports Pack', description: 'Live football (EPL, UCL feeds) and sports news.', priceIndividual: 500, priceBusinessMonthly: 15000 },
  { bundleId: 'entertainment-pack', name: 'Entertainment Pack', description: 'Nollywood, US/UK shows & movies, skits.', priceIndividual: 300, priceBusinessMonthly: 10000 },
];

const channels = [
  {
    displayName: 'CipherStream News (Free Preview)', category: 'News', tier: 'free', bundleId: 'free-tier',
    description: 'Always-free news channel, no unlock needed.', logo: '',
    streamUrl: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
    sourceGroup: 'News',
  },
  {
    displayName: 'Naija Football Live', category: 'Sports', tier: 'individual', bundleId: 'sports-pack',
    description: 'Live football coverage.', logo: '',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    sourceGroup: 'Sports',
  },
  {
    displayName: 'Naija Movies & Shows', category: 'Shows & Movies', tier: 'individual', bundleId: 'entertainment-pack',
    description: 'Nollywood and popular international shows.', logo: '',
    streamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    sourceGroup: 'Entertainment',
  },
];

router.get('/seed', async (req, res) => {
  try {
    if (req.query.key !== SEED_KEY) {
      return res.status(401).json({ error: 'Invalid seed key' });
    }
    await Bundle.deleteMany({});
    await Bundle.insertMany(bundles);
    await Channel.deleteMany({});
    await Channel.insertMany(channels);
    res.json({ seeded: true, bundles: bundles.length, channels: channels.length });
  } catch (err) {
    console.error('[admin/seed] Failed:', err);
    res.status(500).json({ error: 'Seed failed', detail: err.message });
  }
});

export default router;
