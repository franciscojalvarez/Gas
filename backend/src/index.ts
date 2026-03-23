import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth.routes';
import bloque1Routes from './routes/bloque1.routes';
import bloque2Routes from './routes/bloque2.routes';
import bloque3Routes from './routes/bloque3.routes';
import bloque4Routes from './routes/bloque4.routes';
import bloque5Routes from './routes/bloque5.routes';
import bloque6Routes from './routes/bloque6.routes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/bloque1', bloque1Routes);
app.use('/api/bloque2', bloque2Routes);
app.use('/api/bloque3', bloque3Routes);
app.use('/api/bloque4', bloque4Routes);
app.use('/api/bloque5', bloque5Routes);
app.use('/api/bloque6', bloque6Routes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

async function connectWithRetry(retries = 10, delay = 3000): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try {
      await AppDataSource.initialize();
      console.log('✅ Base de datos conectada correctamente');
      return;
    } catch (err: any) {
      console.log(`⏳ Intento ${i}/${retries} — esperando base de datos... (${err.message})`);
      if (i === retries) throw err;
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

connectWithRetry()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  });
