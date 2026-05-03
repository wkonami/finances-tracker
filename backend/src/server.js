require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const authRoutes = require('./routes/auth');
const debtRoutes = require('./routes/debts');

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

app.use(express.json());
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});
app.use('/api/auth', authRoutes);
app.use('/api/debts', debtRoutes);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));