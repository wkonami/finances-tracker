require('dotenv').config();

const express = require('express');

const cors = require('cors');

const app = express();

const authRoutes = require('./routes/auth');

const debtRoutes = require('./routes/debts');

const userRoutes = require('./routes/users');

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ||
  'http://localhost:3000';

app.use(express.json());

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));

app.get('/', (req, res) => {

  res.send('API ONLINE');

});

app.get('/health', (req, res) => {

  res.json({ ok: true });

});

app.use('/api/auth', authRoutes);

app.use('/api/debts', debtRoutes);

app.use('/api/users', userRoutes);

app.use((req, res) => {

  res.status(404).json({
    message: 'Route not found'
  });

});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});