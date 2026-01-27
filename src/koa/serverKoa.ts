import 'dotenv/config';
import Koa from 'koa';
import cors from '@koa/cors';
import empresaKoaRoutes from './routes/empresaKoaRoutes';

const app = new Koa();

app.use(cors());
app.use(empresaKoaRoutes.routes());
app.use(empresaKoaRoutes.allowedMethods());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Koa server rodando na porta ${PORT}`);
});
