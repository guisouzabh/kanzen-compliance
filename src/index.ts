import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';

import authRoutes from './routes/authRoutes';
import empresaRoutes from './routes/empresaRoutes';
import requisitoRoutes from './routes/requisitoRoutes';
import uploadRoutes from './routes/uploadRoutes';
import areaRoutes from './routes/areaRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import classificacaoRoutes from './routes/classificacaoRoutes';
import unidadeRoutes from './routes/unidadeRoutes';
import subareaRoutes from './routes/subareaRoutes';
import subarea2Routes from './routes/subarea2Routes';
import inboxRoutes from './routes/inboxRoutes';
import documentoRegulatorioRoutes from './routes/documentoRegulatorioRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// Rotas públicas (auth)
app.use('/api/v1', authRoutes);

// Rotas protegidas (empresas)
app.use('/api/v1', empresaRoutes);
app.use('/api/v1', requisitoRoutes);
app.use('/api/v1', uploadRoutes);
app.use('/api/v1', areaRoutes);
app.use('/api/v1', unidadeRoutes);
app.use('/api/v1', subareaRoutes);
app.use('/api/v1', subarea2Routes);
app.use('/api/v1', usuarioRoutes);
app.use('/api/v1', classificacaoRoutes);
app.use('/api/v1', inboxRoutes);
app.use('/api/v1', documentoRegulatorioRoutes);

app.get('/', (req, res) => {
  res.send('API RLK rodando com backend pro + auth.');
});

// middleware global de erro SEMPRE por último
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
