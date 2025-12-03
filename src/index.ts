import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes';
import empresaRoutes from './routes/empresaRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rotas públicas (auth)
app.use('/api/v1', authRoutes);

// Rotas protegidas (empresas)
app.use('/api/v1', empresaRoutes);

app.get('/', (req, res) => {
  res.send('API RLK rodando com backend pro + auth.');
});

// middleware global de erro SEMPRE por último
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
