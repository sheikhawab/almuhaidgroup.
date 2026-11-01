import { Router } from 'express';
import { findInspectionsByWorkOrder, saveInspection } from '../models/inspection.js';
import { inspectionSchema } from '../schemas/inspection.js';

const router = Router();

router.post('/', async (req, res) => {
  const result = inspectionSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }

  res.json(await saveInspection(result.data));
});

router.get('/', async (req, res) => {
  const { workOrder } = req.query;
  if (typeof workOrder !== 'string' || !workOrder.trim()) {
    return res.status(400).json({
      errors: [{ path: ['workOrder'], message: 'workOrder is required' }],
    });
  }

  res.json(await findInspectionsByWorkOrder(workOrder.trim()));
});

export default router;
