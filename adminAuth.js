import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

// Separate token scope from requireAuth (customers) — an admin token can
// never be used to hit customer-only routes and vice versa, since we check
// req.admin.type === 'admin' explicitly.
export function signAdminToken(payload) {
  return jwt.sign({ ...payload, type: 'admin' }, config.jwtSecret, { expiresIn: '2d' });
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.type !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired admin session' });
  }
}
