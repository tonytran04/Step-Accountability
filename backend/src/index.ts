import express from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.put('/api/steps/:date', (req, res) => {
    const { date } = req.params;
    const { steps, goal } = req.body;
  
    console.log('Received step data:', {
      date,
      steps,
      goal,
    });
  
    res.json({
      message: 'Step data received',
      date,
      steps,
      goal,
    });
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});