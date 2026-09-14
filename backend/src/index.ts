import express from 'express';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.put('/api/steps/:date', async (req, res) => {
    const { date } = req.params;
    const { steps, goal } = req.body;
  
    const { data, error } = await supabase
      .from('daily_steps')
      .upsert(
        {
          date,
          steps,
          goal,
          synced_at: new Date().toISOString(),
        },
        {
          onConflict: 'date',
        },
      )
      .select()
      .single();
  
    if (error) {
      console.error('Supabase error:', error);
  
      return res.status(500).json({
        error: 'Failed to save step data',
      });
    }
  
    console.log('Saved step data:', data);
  
    res.json({
      message: 'Step data saved',
      data,
    });
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.get('/api/steps', async (_req, res) => {
    const { data, error } = await supabase
      .from('daily_steps')
      .select('date, steps, goal, synced_at')
      .order('date', { ascending: false });
  
    if (error) {
      console.error('Supabase error:', error);
  
      return res.status(500).json({
        error: 'Failed to load step history',
      });
    }
  
    res.json(data);
  });