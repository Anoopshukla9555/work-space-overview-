import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import auth from './routes/auth.js';
import items from './routes/items.js';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  }),
  auth
);

// IMPORTANT
app.use('/api/items', items);

app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(err.status || 500).json({
    error:
      err.status
        ? err.message
        : 'Something went wrong. Please try again.',
  });
});

try {
  await mongoose.connect(process.env.MONGO_URI);

  console.log('MongoDB connected');

  app.listen(
    process.env.PORT || 5000,
    () => {
      console.log(
        `API ready on http://localhost:${process.env.PORT || 5000}`
      );
    }
  );

} catch (error) {

  console.error(
    'MongoDB connection failed:',
    error.message
  );

  process.exit(1);
}