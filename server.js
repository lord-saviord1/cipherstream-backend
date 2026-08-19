import app from './app.js';
import { config } from './config/env.js';
app.listen(config.port, () => console.log(`[server] CipherStream backend running on port ${config.port}`));
