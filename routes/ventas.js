import express from 'express';
import Venta from '../models/Venta.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(requireAuth);

// GET /api/ventas/today - Obtener ventas del día (DEBE IR ANTES que /:id)
router.get('/today', async (req, res) => {
  try {
    const ventas = await Venta.findToday();
    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas del día:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas del día'
    });
  }
});

// GET /api/ventas/stats - Obtener estadísticas de ventas (DEBE IR ANTES que /:id)
router.get('/stats', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const stats = await Venta.getStats(fechaInicio, fechaFin);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
});

// GET /api/ventas/vendedor/:nombre - Obtener ventas por vendedor (DEBE IR ANTES que /:id)
router.get('/vendedor/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;
    
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nombre del vendedor es requerido'
      });
    }

    const ventas = await Venta.findByVendedor(nombre);

    res.json({
      success: true,
      vendedor: nombre,
      ventas
    });

  } catch (error) {
    console.error('Error al obtener ventas por vendedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas por vendedor'
    });
  }
});

// GET /api/ventas/fecha/:fecha - Obtener ventas por fecha específica (DEBE IR ANTES que /:id)
router.get('/fecha/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;
    
    // Validar formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }

    const ventas = await Venta.findByDate(fecha);

    res.json({
      success: true,
      fecha,
      ventas
    });

  } catch (error) {
    console.error('Error al obtener ventas por fecha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas por fecha'
    });
  }
});

// GET /api/ventas/:id - Obtener venta por ID (DEBE IR DESPUÉS de las rutas específicas)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de venta inválido'
      });
    }

    const venta = await Venta.findById(id);
    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      venta
    });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener venta'
    });
  }
});

// GET /api/ventas - Obtener todas las ventas
router.get('/', async (req, res) => {
  try {
    const { fecha, vendedor, estado } = req.query;
    
    let ventas;
    
    if (fecha) {
      ventas = await Venta.findByDate(fecha);
    } else if (vendedor) {
      ventas = await Venta.findByVendedor(vendedor);
    } else {
      ventas = await Venta.findAll();
    }
    
    // Filtrar por estado si se especifica
    if (estado && ['completada', 'cancelada'].includes(estado)) {
      ventas = ventas.filter(v => v.estado === estado);
    }
    
    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas'
    });
  }
});

// POST /api/ventas - Crear nueva venta
router.post('/', async (req, res) => {
  try {
    const { vendedor, productos, total } = req.body;

    // Validar datos requeridos
    if (!vendedor || !productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vendedor y productos son requeridos'
      });
    }

    // Validar total
    if (total === undefined || isNaN(total) || total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total debe ser un número mayor a 0'
      });
    }

    // Validar cada producto
    for (let item of productos) {
      if (!item.producto_id || !item.cantidad || !item.precio) {
        return res.status(400).json({
          success: false,
          message: 'Cada producto debe tener ID, cantidad y precio'
        });
      }

      if (isNaN(item.producto_id) || isNaN(item.cantidad) || isNaN(item.precio)) {
        return res.status(400).json({
          success: false,
          message: 'ID del producto, cantidad y precio deben ser números'
        });
      }

      if (item.cantidad <= 0 || item.precio <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Cantidad y precio deben ser valores positivos'
        });
      }
    }

    // Validar que el total calculado coincida
    const totalCalculado = productos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const diferencia = Math.abs(totalCalculado - total);
    
    if (diferencia > 0.01) { // Permitir pequeña diferencia por redondeo
      return res.status(400).json({
        success: false,
        message: 'El total no coincide con la suma de los productos'
      });
    }

    const newVenta = await Venta.create({
      vendedor: vendedor.trim(),
      productos,
      total: parseFloat(total)
    });

    res.status(201).json({
      success: true,
      message: 'Venta creada exitosamente',
      venta: newVenta
    });

  } catch (error) {
    console.error('Error al crear venta:', error);
    
    if (error.message.includes('Stock insuficiente') || error.message.includes('no encontrado')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear venta'
    });
  }
});

// PUT /api/ventas/:id/cancelar - Cancelar venta
router.put('/:id/cancelar', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de venta inválido'
      });
    }

    const ventaCancelada = await Venta.cancel(id);

    res.json({
      success: true,
      message: 'Venta cancelada exitosamente',
      venta: ventaCancelada
    });

  } catch (error) {
    console.error('Error al cancelar venta:', error);
    
    if (error.message.includes('Venta no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('ya está cancelada')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al cancelar venta'
    });
  }
});

export default router;