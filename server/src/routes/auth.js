import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { sendMail } from '../mail.js';

const r = Router();
const google = new OAuth2Client();
const PURPOSES = ['shayari', 'documents', 'photos', 'notes'];
const pub = u => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, purposes: u.purposes,
  onboarded: u.onboarded, emailVerified: u.emailVerified, hasPassword: !!u.passwordHash,
  storageUsed: u.storageUsed, storageLimit: u.storageLimit });
const session = (res, u) => {
  const token = jwt.sign({ uid: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 864e5,
  });
};
const makeToken = async (u, type, mins) => {
  const raw = crypto.randomBytes(32).toString('hex');
  Object.assign(u, { tokenHash: crypto.createHash('sha256').update(raw).digest('hex'), tokenType: type, tokenExpires: Date.now() + mins * 6e4 });
  await u.save();
  return `${process.env.CLIENT_URL}/${type === 'verify' ? 'verify' : 'reset'}?token=${raw}&email=${encodeURIComponent(u.email)}`;
};
const useToken = async (email, raw, type) => {
  const u = await User.findOne({ email: String(email).toLowerCase() });
  const h = crypto.createHash('sha256').update(String(raw)).digest('hex');
  return u && u.tokenType === type && u.tokenHash === h && u.tokenExpires > Date.now() ? u : null;
};
const parse = (schema, body) => { const p = schema.safeParse(body); if (!p.success) throw Object.assign(new Error(p.error.issues[0].message), { status: 400 }); return p.data; };
const password = z.string().min(8, 'Password must be at least 8 characters.').max(100);
const wrap = fn => (q, s, n) => fn(q, s, n).catch(n); // Express 4 async errors

r.post('/register', wrap(async (req, res) => {
  const d = parse(z.object({ name: z.string().min(1, 'Enter your name.').max(80), email: z.string().email('Enter a valid email.'), password }), req.body);
  if (await User.findOne({ email: d.email.toLowerCase() })) return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
  const u = await User.create({ name: d.name, email: d.email, passwordHash: await bcrypt.hash(d.password, 12) });
  await sendMail(u.email, 'Verify your email', await makeToken(u, 'verify', 1440));
  session(res, u);
  res.status(201).json({ user: pub(u) });
}));
r.post('/login', wrap(async (req, res) => {
  const d = parse(z.object({ email: z.string().email('Enter a valid email.'), password: z.string().min(1, 'Enter your password.') }), req.body);
  const u = await User.findOne({ email: d.email.toLowerCase() });
  if (!u?.passwordHash || !(await bcrypt.compare(d.password, u.passwordHash))) return res.status(401).json({ error: 'Incorrect email or password.' });
  session(res, u);
  res.json({ user: pub(u) });
}));
r.post('/google', wrap(async (req, res) => {
  const { credential } = parse(z.object({ credential: z.string() }), req.body);
  const t = await google.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
  const p = t.getPayload();
  let u = await User.findOne({ email: p.email.toLowerCase() });
  if (!u) u = await User.create({ name: p.name, email: p.email, googleId: p.sub, avatar: p.picture, emailVerified: true });
  else { u.googleId ||= p.sub; u.avatar ||= p.picture; u.emailVerified = true; await u.save(); }
  session(res, u);
  res.json({ user: pub(u) });
}));
r.post('/logout', (_q, res) => { res.clearCookie('token'); res.json({ ok: true }); });
r.get('/me', requireAuth, (req, res) => res.json({ user: pub(req.user) }));
r.post('/verify', wrap(async (req, res) => {
  const u = await useToken(req.body.email, req.body.token, 'verify');
  if (!u) return res.status(400).json({ error: 'This verification link is invalid or has expired.' });
  Object.assign(u, { emailVerified: true, tokenHash: null, tokenType: null }); await u.save();
  res.json({ ok: true });
}));
r.post('/forgot', wrap(async (req, res) => {
  const u = await User.findOne({ email: String(req.body.email || '').toLowerCase() });
  if (u?.passwordHash) await sendMail(u.email, 'Reset your password', await makeToken(u, 'reset', 30));
  res.json({ ok: true }); // same reply either way, so emails can't be probed
}));
r.post('/reset', wrap(async (req, res) => {
  const d = parse(z.object({ email: z.string(), token: z.string(), password }), req.body);
  const u = await useToken(d.email, d.token, 'reset');
  if (!u) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  Object.assign(u, { passwordHash: await bcrypt.hash(d.password, 12), tokenHash: null, tokenType: null }); await u.save();
  res.json({ ok: true });
}));
r.put('/purposes', requireAuth, wrap(async (req, res) => {
  const { purposes } = parse(z.object({ purposes: z.array(z.enum(PURPOSES)).min(1, 'Pick at least one option.') }), req.body);
  Object.assign(req.user, { purposes, onboarded: true }); await req.user.save();
  res.json({ user: pub(req.user) });
}));
export default r;
