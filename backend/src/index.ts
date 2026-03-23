import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import bloque1Routes from './routes/bloque1.routes';
import bloque2Routes from './routes/bloque2.routes';
import bloque3Routes from './routes/bloque3.routes';
import bloque4Routes from './routes/bloque4.routes';
import bloque5Routes from './routes/bloque5.routes';
import bloque6Routes from './routes/bloque6.routes';
import excelRoutes from './routes/excel.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bloque1', bloque1Routes);
app.use('/api/bloque2', bloque2Routes);
app.use('/api/bloque3', bloque3Routes);
app.use('/api/bloque4', bloque4Routes);
app.use('/api/bloque5', bloque5Routes);
app.use('/api/bloque6', bloque6Routes);
app.use('/api/excel', excelRoutes);

// Error handler
app.use(errorHandler);

// Initialize database and start server
AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error during database initialization:', error);
    process.exit(1);
  });
