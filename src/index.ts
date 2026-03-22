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
import documentoEmpresaRoutes from './routes/documentoEmpresaRoutes';
import inventarioDadoRoutes from './routes/inventarioDadoRoutes';
import categoriaDadoPessoalRoutes from './routes/categoriaDadoPessoalRoutes';
import processoRoutes from './routes/processoRoutes';
import solicitacaoTitularRoutes from './routes/solicitacaoTitularRoutes';
import statusLgpdRoutes from './routes/statusLgpdRoutes';
import empresaDadosStatusRoutes from './routes/empresaDadosStatusRoutes';
import diagnosticoLgpdRoutes from './routes/diagnosticoLgpdRoutes';
import matrizAcaoRoutes from './routes/matrizAcaoRoutes';
import comiteRoutes from './routes/comiteRoutes';
import baseLegalRoutes from './routes/baseLegalRoutes';
import privacyCaseRoutes from './routes/privacyCaseRoutes';
import cnaeRoutes from './routes/cnaeRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));
app.use('/arquivos-s3', express.static(path.resolve(__dirname, '..', 'arquivos-s3')));

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
app.use('/api/v1', documentoEmpresaRoutes);
app.use('/api/v1', inventarioDadoRoutes);
app.use('/api/v1', categoriaDadoPessoalRoutes);
app.use('/api/v1', processoRoutes);
app.use('/api/v1', solicitacaoTitularRoutes);
app.use('/api/v1', statusLgpdRoutes);
app.use('/api/v1', empresaDadosStatusRoutes);
app.use('/api/v1', diagnosticoLgpdRoutes);
app.use('/api/v1', matrizAcaoRoutes);
app.use('/api/v1', comiteRoutes);
app.use('/api/v1', baseLegalRoutes);
app.use('/api/v1', privacyCaseRoutes);
app.use('/api/v1', cnaeRoutes);

app.get('/', (req, res) => {
  res.send('API RLK rodando com backend pro + auth.');
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// middleware global de erro SEMPRE por último
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
