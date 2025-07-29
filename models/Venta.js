import { query } from '../config/database.js';
import Producto from './Producto.js';

class Venta {
  constructor(data) {
    this.id = data.id;
    this.fecha = data.fecha;
    this.vendedor = data.vendedor;
    this.total = data.total;
    this.estado = data.estado;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.productos = data.productos || [];
  }

  // Obtener todas las ventas con sus detalles
  static async findAll() {
    try {
      const ventas = await query(`
        SELECT * FROM ventas 
        ORDER BY fecha DESC
      `);

      // Obtener detalles para cada venta
      for (let venta of ventas) {
        venta.productos = await VentaDetalle.findByVentaId(venta.id);
      }

      return ventas.map(venta => new Venta(venta));
    } catch (error) {
      throw new Error(`Error al obtener ventas: ${error.message}`);
    }
  }

  // Buscar venta por ID
  static async findById(id) {
    try {
      const ventas = await query(
        'SELECT * FROM ventas WHERE id = ?',
        [id]
      );

      if (ventas.length === 0) {
        return null;
      }

      const venta = ventas[0];
      venta.productos = await VentaDetalle.findByVentaId(id);

      return new Venta(venta);
    } catch (error) {
      throw new Error(`Error al buscar venta: ${error.message}`);
    }
  }

  // Obtener ventas por fecha
  static async findByDate(fecha) {
    try {
      const ventas = await query(`
        SELECT * FROM ventas 
        WHERE DATE(fecha) = DATE(?)
        ORDER BY fecha DESC
      `, [fecha]);

      // Obtener detalles para cada venta
      for (let venta of ventas) {
        venta.productos = await VentaDetalle.findByVentaId(venta.id);
      }

      return ventas.map(venta => new Venta(venta));
    } catch (error) {
      throw new Error(`Error al obtener ventas por fecha: ${error.message}`);
    }
  }

  // Obtener ventas del día actual
  static async findToday() {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await Venta.findByDate(today);
    } catch (error) {
      throw new Error(`Error al obtener ventas del día: ${error.message}`);
    }
  }

  // Crear nueva venta
  static async create(ventaData) {
    try {
      const { vendedor, productos, total } = ventaData;

      // Validar que hay productos
      if (!productos || productos.length === 0) {
        throw new Error('La venta debe tener al menos un producto');
      }

      // Verificar stock de todos los productos antes de procesar
      for (let item of productos) {
        const producto = await Producto.findById(item.producto_id);
        if (!producto) {
          throw new Error(`Producto con ID ${item.producto_id} no encontrado`);
        }
        if (!producto.hasStock(item.cantidad)) {
          throw new Error(`Stock insuficiente para el producto ${producto.nombre}`);
        }
      }

      // Crear la venta
      const result = await query(
        'INSERT INTO ventas (vendedor, total, estado) VALUES (?, ?, ?)',
        [vendedor, total, 'completada']
      );

      const ventaId = result.insertId;

      // Agregar detalles de la venta y actualizar stock
      for (let item of productos) {
        const subtotal = item.precio * item.cantidad;
        
        // Insertar detalle
        await query(
          'INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio, subtotal) VALUES (?, ?, ?, ?, ?)',
          [ventaId, item.producto_id, item.cantidad, item.precio, subtotal]
        );

        // Reducir stock
        await Producto.reduceStock(item.producto_id, item.cantidad);
      }

      // Obtener la venta completa
      return await Venta.findById(ventaId);
    } catch (error) {
      throw new Error(`Error al crear venta: ${error.message}`);
    }
  }

  // Cancelar venta
  static async cancel(id) {
    try {
      const venta = await Venta.findById(id);
      if (!venta) {
        throw new Error('Venta no encontrada');
      }

      if (venta.estado === 'cancelada') {
        throw new Error('La venta ya está cancelada');
      }

      // Actualizar estado de la venta
      await query(
        'UPDATE ventas SET estado = ? WHERE id = ?',
        ['cancelada', id]
      );

      // Devolver stock de los productos
      for (let item of venta.productos) {
        await Producto.increaseStock(item.producto_id, item.cantidad);
      }

      // Retornar la venta actualizada
      return await Venta.findById(id);
    } catch (error) {
      throw new Error(`Error al cancelar venta: ${error.message}`);
    }
  }

  // Obtener ventas por vendedor
  static async findByVendedor(vendedor) {
    try {
      const ventas = await query(`
        SELECT * FROM ventas 
        WHERE vendedor = ?
        ORDER BY fecha DESC
      `, [vendedor]);

      // Obtener detalles para cada venta
      for (let venta of ventas) {
        venta.productos = await VentaDetalle.findByVentaId(venta.id);
      }

      return ventas.map(venta => new Venta(venta));
    } catch (error) {
      throw new Error(`Error al obtener ventas por vendedor: ${error.message}`);
    }
  }

  // Obtener estadísticas de ventas
  static async getStats(fechaInicio = null, fechaFin = null) {
    try {
      let whereClause = '';
      let params = [];

      if (fechaInicio && fechaFin) {
        whereClause = 'WHERE DATE(fecha) BETWEEN ? AND ?';
        params = [fechaInicio, fechaFin];
      } else if (fechaInicio) {
        whereClause = 'WHERE DATE(fecha) >= ?';
        params = [fechaInicio];
      }

      const stats = await query(`
        SELECT 
          COUNT(*) as total_ventas,
          COUNT(CASE WHEN estado = 'completada' THEN 1 END) as ventas_completadas,
          COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as ventas_canceladas,
          COALESCE(SUM(CASE WHEN estado = 'completada' THEN total ELSE 0 END), 0) as ingresos_totales,
          COALESCE(AVG(CASE WHEN estado = 'completada' THEN total ELSE NULL END), 0) as promedio_venta
        FROM ventas
        ${whereClause}
      `, params);

      return stats[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }
}

// Clase para manejar los detalles de venta
class VentaDetalle {
  constructor(data) {
    this.id = data.id;
    this.venta_id = data.venta_id;
    this.producto_id = data.producto_id;
    this.cantidad = data.cantidad;
    this.precio = data.precio;
    this.subtotal = data.subtotal;
    this.nombre = data.nombre;
    this.codigo = data.codigo;
  }

  // Obtener detalles de una venta específica
  static async findByVentaId(ventaId) {
    try {
      const detalles = await query(`
        SELECT 
          vd.*,
          p.nombre,
          p.codigo
        FROM venta_detalles vd
        JOIN productos p ON vd.producto_id = p.id
        WHERE vd.venta_id = ?
        ORDER BY vd.id
      `, [ventaId]);

      return detalles.map(detalle => new VentaDetalle(detalle));
    } catch (error) {
      throw new Error(`Error al obtener detalles de venta: ${error.message}`);
    }
  }
}

export default Venta;
export { VentaDetalle };