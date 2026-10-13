import { Router } from 'express';
import healthRoutes from './health.routes';

/**
 * The route table: one line per feature area. As the project grows
 * (auth, documents, chat) each gets its own router mounted here.
 */
const router = Router();

router.use('/health', healthRoutes);

export default router;
