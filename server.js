import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import proveedorRoutes from './routes/proveedores.js';
import categoriaRoutes from './routes/categorias.js';
import productoRoutes from './routes/productos.js';
import ventaRoutes from './routes/ventas.js';
import corteCajaRoutes from './routes/corte-caja.js';

// Configurar dotenv
dotenv.config();

// Crear aplicación Express
const app = express();

const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());

// Middleware para logging de requests
app.use((req, res, next) => {
  //console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/corte-caja', corteCajaRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API de Ferretería funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Middleware para manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 API disponible en: http://localhost:${PORT}/api`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;