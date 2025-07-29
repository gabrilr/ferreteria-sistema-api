import express from 'express';
import { query } from '../config/database.js';
import Venta from '../models/Venta.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(requireAuth);

// GET /api/corte-caja - Obtener todos los cortes de caja
router.get('/', async (req, res) => {
  try {
    const { fecha, responsable } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (fecha) {
      whereClause = 'WHERE DATE(fecha) = ?';
      params.push(fecha);
    } else if (responsable) {
      whereClause = 'WHERE responsable = ?';
      params.push(responsable);
    }

    const cortes = await query(`
      SELECT * FROM cortes_caja 
      ${whereClause}
      ORDER BY fecha DESC
    `, params);

    res.json({
      success: true,
      cortes
    });

  } catch (error) {
    console.error('Error al obtener cortes de caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cortes de caja'
    });
  }
});

// GET /api/corte-caja/today - Obtener corte del día actual
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const cortes = await query(
      'SELECT * FROM cortes_caja WHERE DATE(fecha) = ? ORDER BY fecha DESC LIMIT 1',
      [today]
    );

    res.json({
      success: true,
      corte: cortes.length > 0 ? cortes[0] : null
    });

  } catch (error) {
    console.error('Error al obtener corte del día:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener corte del día'
    });
  }
});

// GET /api/corte-caja/:id - Obtener corte específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de corte inválido'
      });
    }

    const cortes = await query(
      'SELECT * FROM cortes_caja WHERE id = ?',
      [id]
    );

    if (cortes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Corte de caja no encontrado'
      });
    }

    res.json({
      success: true,
      corte: cortes[0]
    });

  } catch (error) {
    console.error('Error al obtener corte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener corte de caja'
    });
  }
});

// POST /api/corte-caja - Crear nuevo corte de caja
router.post('/', async (req, res) => {
  try {
    const { responsable, ventasCompletadas, ventasCanceladas, totalIngresos, productosVendidos } = req.body;

    // Validar datos requeridos
    if (!responsable) {
      return res.status(400).json({
        success: false,
        message: 'Responsable es requerido'
      });
    }

    // Validar números
    const ventasCompletadasNum = parseInt(ventasCompletadas) || 0;
    const ventasCanceladasNum = parseInt(ventasCanceladas) || 0;
    const totalIngresosNum = parseFloat(totalIngresos) || 0;
    const productosVendidosNum = parseInt(productosVendidos) || 0;

    // Verificar si ya existe un corte para el día actual
    const today = new Date().toISOString().split('T')[0];
    const existingCorte = await query(
      'SELECT id FROM cortes_caja WHERE DATE(fecha) = ?',
      [today]
    );

    if (existingCorte.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un corte de caja para el día de hoy'
      });
    }

    // Obtener datos reales de las ventas del día para validar
    const ventasDelDia = await Venta.findToday();
    const ventasRealesCompletadas = ventasDelDia.filter(v => v.estado === 'completada');
    const ventasRealesCanceladas = ventasDelDia.filter(v => v.estado === 'cancelada');
    const ingresosTotalesReales = ventasRealesCompletadas.reduce((total, v) => total + v.total, 0);

    // Validar que los datos coincidan (con margen de error pequeño)
    const margenError = 0.01;
    if (Math.abs(totalIngresosNum - ingresosTotalesReales) > margenError) {
      console.warn(`Diferencia en ingresos: Enviado: ${totalIngresosNum}, Real: ${ingresosTotalesReales}`);
    }

    // Insertar corte de caja
    const result = await query(`
      INSERT INTO cortes_caja 
      (responsable, ventasCompletadas, ventasCanceladas, totalIngresos, productosVendidos) 
      VALUES (?, ?, ?, ?, ?)
    `, [
      responsable.trim(),
      ventasCompletadasNum,
      ventasCanceladasNum,
      totalIngresosNum,
      productosVendidosNum
    ]);

    // Obtener el corte creado
    const nuevoCorte = await query(
      'SELECT * FROM cortes_caja WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Corte de caja creado exitosamente',
      corte: nuevoCorte[0]
    });

  } catch (error) {
    console.error('Error al crear corte de caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear corte de caja'
    });
  }
});

// GET /api/corte-caja/resumen/today - Obtener resumen para corte del día
router.get('/resumen/today', async (req, res) => {
  try {
    // Permitir fecha por query param
    const fechaParam = req.query.fecha;
    let fecha;
    if (fechaParam) {
      console.log(`Obteniendo resumen para fecha: ${fechaParam}`);
      
      // Convierte la fecha UTC a local
      const dateObj = new Date(fechaParam);
      fecha = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
      log(`Fecha ajustada: ${fecha}`);
    } else {
      fecha = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
    }

    // Obtener ventas de la fecha indicada
    const ventasDelDia = await Venta.findByDate(fecha);

    // Calcular estadísticas
    const ventasCompletadas = ventasDelDia.filter(v => v.estado === 'completada');
    const ventasCanceladas = ventasDelDia.filter(v => v.estado === 'cancelada');
    const totalIngresos = ventasCompletadas.reduce((total, v) => total + (v.total || 0), 0);
    const totalCancelados = ventasCanceladas.reduce((total, v) => total + (v.total || 0), 0);

    // Calcular productos vendidos
    let productosVendidos = 0;
    ventasCompletadas.forEach(venta => {
      if (venta.productos && Array.isArray(venta.productos)) {
        productosVendidos += venta.productos.reduce((total, p) => total + p.cantidad, 0);
      }
    });

    // Calcular promedio por venta
    const promedioVenta = ventasCompletadas.length > 0 ? totalIngresos / ventasCompletadas.length : 0;
    // Calcular tasa de éxito
    const tasaExito = ventasDelDia.length > 0 ? (ventasCompletadas.length / ventasDelDia.length) * 100 : 0;

    // Verificar si ya existe un corte para esa fecha
    const corteExistente = await query(
      'SELECT id FROM cortes_caja WHERE DATE(fecha) = ?',
      [fecha]
    );

    const resumen = {
      fecha,
      ventasCompletadas: ventasCompletadas.length,
      ventasCanceladas: ventasCanceladas.length,
      totalVentas: ventasDelDia.length,
      totalIngresos: parseFloat(totalIngresos.toFixed(2)),
      totalCancelados: parseFloat(totalCancelados.toFixed(2)),
      productosVendidos,
      promedioVenta: parseFloat(promedioVenta.toFixed(2)),
      tasaExito: parseFloat(tasaExito.toFixed(1)),
      corteYaRealizado: corteExistente.length > 0,
      ventas: ventasDelDia
    };

    res.json({
      success: true,
      resumen
    });

  } catch (error) {
    console.error('Error al obtener resumen del día:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen del día'
    });
  }
});

// GET /api/corte-caja/estadisticas/periodo - Obtener estadísticas por período
router.get('/estadisticas/periodo', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de inicio y fin son requeridas'
      });
    }

    // Validar formato de fechas
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fechaInicio) || !fechaRegex.test(fechaFin)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }

    const estadisticas = await query(`
      SELECT 
        COUNT(*) as totalCortes,
        SUM(ventasCompletadas) as totalVentasCompletadas,
        SUM(ventasCanceladas) as totalVentasCanceladas,
        SUM(totalIngresos) as totalIngresosPeriodo,
        SUM(productosVendidos) as totalProductosVendidos,
        AVG(totalIngresos) as promedioIngresosDiarios,
        MAX(totalIngresos) as mejorDia,
        MIN(totalIngresos) as peorDia
      FROM cortes_caja 
      WHERE DATE(fecha) BETWEEN ? AND ?
    `, [fechaInicio, fechaFin]);

    res.json({
      success: true,
      periodo: {
        fechaInicio,
        fechaFin
      },
      estadisticas: estadisticas[0]
    });

  } catch (error) {
    console.error('Error al obtener estadísticas por período:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas por período'
    });
  }
});

export default router;