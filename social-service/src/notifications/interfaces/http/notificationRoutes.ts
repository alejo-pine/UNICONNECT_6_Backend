import { Router } from 'express';
import { supabase } from '../../../utils/supabaseClient';
import authMiddleware from '../../../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications', message: error.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update notification', message: error.message });
  }
});

export default router;
