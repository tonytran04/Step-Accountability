import express from 'express';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3000;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

app.use(express.json({limit: '16kb'}));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.put('/api/steps/:date', async (req, res) => {
    const {date} = req.params;
    const {steps, goal, updateGoal = false} = req.body ?? {};

    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date ||
        !Number.isSafeInteger(steps) || steps < 0 ||
        !Number.isSafeInteger(goal) || goal <= 0 || typeof updateGoal !== 'boolean') {
      return res.status(400).json({error: 'Provide a valid date, nonnegative steps, and a positive goal'});
    }
  
    // Check whether this date already exists.
    const {data: existingEntry, error: lookupError} = await supabase
      .from('daily_steps')
      .select('goal')
      .eq('date', date)
      .maybeSingle();
  
    if (lookupError) {
      console.error('Supabase lookup error:', lookupError);
  
      return res.status(500).json({
        error: 'Failed to check existing step data',
      });
    }
  
    // Keep older days' goals as recorded; the client may update today's goal.
    const goalToSave = updateGoal ? goal : existingEntry?.goal ?? goal;
  
    const {data, error} = await supabase
      .from('daily_steps')
      .upsert(
        {
          date,
          steps,
          goal: goalToSave,
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
