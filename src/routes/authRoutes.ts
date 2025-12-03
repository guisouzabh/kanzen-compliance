import { Router } from 'express';
import { registrarUsuario, login } from '../controllers/authController';

const router = Router();

router.post('/auth/register', registrarUsuario);
router.post('/auth/login', login);

export default router;
