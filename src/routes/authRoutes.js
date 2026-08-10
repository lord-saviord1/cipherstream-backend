import express from 'express';
import User from '../models/User.js';
import Business from '../models/Business.js';
import { createReservedAccount, nameEnquiry } from '../services/monnifyService.js';
import { signToken } from '../middleware/auth.js';
import { config } from '../config/env.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user = new User({ name, email });
    await user.setPassword(password);
    await user.save();

    // Provision Monnify reserved account (best-effort; don't block signup if this fails in sandbox)
    // Skipped entirely during free-access launch phase — nothing to pay into yet.
    if (!config.freeAccessMode) {
      try {
        const accountRef = `user-${user._id}`;
        const reserved = await createReservedAccount({
          accountReference: accountRef,
          accountName: `CipherStream - ${name}`,
          customerName: name,
          customerEmail: email,
        });
        user.monnifyAccountReference = accountRef;
        user.monnifyAccountNumber = reserved.accountNumber;
        user.monnifyBankName = reserved.bankName;
        await user.save();
      } catch (monnifyErr) {
        console.error('[signup] Monnify reserved account creation failed:', monnifyErr.message);
      }
    }

    const token = signToken({ id: user._id.toString(), type: 'user' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, monnifyAccountNumber: user.monnifyAccountNumber, monnifyBankName: user.monnifyBankName },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken({ id: user._id.toString(), type: 'user' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/business/signup', async (req, res) => {
  try {
    const { businessName, contactEmail, password, address, bankAccountNumber, bankCode } = req.body;
    if (!businessName || !contactEmail || !password) {
      return res.status(400).json({ error: 'businessName, contactEmail, and password are required' });
    }
    const existing = await Business.findOne({ contactEmail: contactEmail.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const business = new Business({ businessName, contactEmail, address });
    await business.setPassword(password);

    if (bankAccountNumber && bankCode) {
      try {
        const result = await nameEnquiry({ accountNumber: bankAccountNumber, bankCode });
        business.bankAccountNumber = bankAccountNumber;
        business.bankCode = bankCode;
        business.verifiedAccountName = result.accountName;
        business.kycVerified = true;
      } catch (kycErr) {
        console.error('[business signup] Name enquiry failed:', kycErr.message);
      }
    }

    await business.save();

    try {
      const accountRef = `biz-${business._id}`;
      const reserved = await createReservedAccount({
        accountReference: accountRef,
        accountName: `CipherStream Biz - ${businessName}`,
        customerName: businessName,
        customerEmail: contactEmail,
      });
      business.monnifyAccountReference = accountRef;
      business.monnifyAccountNumber = reserved.accountNumber;
      business.monnifyBankName = reserved.bankName;
      await business.save();
    } catch (monnifyErr) {
      console.error('[business signup] Monnify reserved account creation failed:', monnifyErr.message);
    }

    const token = signToken({ id: business._id.toString(), type: 'business' });
    res.status(201).json({
      token,
      business: { id: business._id, businessName: business.businessName, contactEmail: business.contactEmail, kycVerified: business.kycVerified, monnifyAccountNumber: business.monnifyAccountNumber, monnifyBankName: business.monnifyBankName },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Business signup failed' });
  }
});

router.post('/business/login', async (req, res) => {
  try {
    const { contactEmail, password } = req.body;
    const business = await Business.findOne({ contactEmail: contactEmail?.toLowerCase() });
    if (!business || !(await business.checkPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken({ id: business._id.toString(), type: 'business' });
    res.json({ token, business: { id: business._id, businessName: business.businessName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Business login failed' });
  }
});

export default router;
