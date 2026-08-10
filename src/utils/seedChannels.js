// TEST STREAMS for validating the watch loop — swap for real curated IPTV
// streams once you've VLC-verified real ones from your channel spreadsheets.
import { connectDB } from '../config/db.js';
import Bundle from '../models/Bundle.js';
import Channel from '../models/Channel.js';

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

async function seed() {
  await connectDB();
  console.log('[seed] Connected to MongoDB');
  await Bundle.deleteMany({});
  await Bundle.insertMany(bundles);
  await Channel.deleteMany({});
  await Channel.insertMany(channels);
  console.log(`[seed] Inserted ${bundles.length} bundles, ${channels.length} channels`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
