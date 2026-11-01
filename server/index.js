import express from 'express';
import prisma from './db.js';
import inspectionsRouter from './routes/inspections.js';

const app = express();
const PORT = process.env.PORT || 5000;

// A 5MB image is about 6.7MB once base64 encoded.
app.use(express.json({ limit: '8mb' }));

app.use('/api/inspections', inspectionsRouter);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/health', async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
