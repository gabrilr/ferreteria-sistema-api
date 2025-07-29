import { query } from '../config/database.js';

class Producto {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.codigo = data.codigo;
    this.precio = data.precio;
    this.stock = data.stock;
    this.stockMinimo = data.stockMinimo;
    this.categoria_id = data.categoria_id;
    this.proveedor_id = data.proveedor_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Obtener todos los productos con información de categoría y proveedor
  static async findAll() {
    try {
      const productos = await query(`
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          pr.nombre as proveedor_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
        ORDER BY p.nombre ASC
      `);
      return productos.map(producto => new Producto(producto));
    } catch (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  // Buscar producto por ID
  static async findById(id) {
    try {
      const productos = await query(`
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          pr.nombre as proveedor_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
        WHERE p.id = ?
      `, [id]);
      return productos.length > 0 ? new Producto(productos[0]) : null;
    } catch (error) {
      throw new Error(`Error al buscar producto: ${error.message}`);
    }
  }

  // Buscar producto por código
  static async findByCodigo(codigo) {
    try {
      const productos = await query(
        'SELECT * FROM productos WHERE codigo = ?',
        [codigo]
      );
      return productos.length > 0 ? new Producto(productos[0]) : null;
    } catch (error) {
      throw new Error(`Error al buscar producto por código: ${error.message}`);
    }
  }

  // Buscar productos por nombre (búsqueda parcial)
  static async findByNombre(nombre) {
    try {
      const productos = await query(`
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          pr.nombre as proveedor_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
        WHERE p.nombre LIKE ?
        ORDER BY p.nombre ASC
      `, [`%${nombre}%`]);
      return productos.map(producto => new Producto(producto));
    } catch (error) {
      throw new Error(`Error al buscar productos por nombre: ${error.message}`);
    }
  }

  // Obtener productos con stock bajo
  static async findLowStock() {
    try {
      const productos = await query(`
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          pr.nombre as proveedor_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
        WHERE p.stock <= p.stockMinimo
        ORDER BY p.stock ASC
      `);
      return productos.map(producto => new Producto(producto));
    } catch (error) {
      throw new Error(`Error al obtener productos con stock bajo: ${error.message}`);
    }
  }

  // Crear nuevo producto
  static async create(productoData) {
    try {
      const { nombre, codigo, precio, stock, stockMinimo, categoria_id, proveedor_id } = productoData;
      
      // Verificar si el código ya existe
      const existingProducto = await Producto.findByCodigo(codigo);
      if (existingProducto) {
        throw new Error('Ya existe un producto con este código');
      }

      // Insertar producto
      const result = await query(
        'INSERT INTO productos (nombre, codigo, precio, stock, stockMinimo, categoria_id, proveedor_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nombre, codigo, precio, stock, stockMinimo, categoria_id, proveedor_id]
      );

      // Obtener el producto creado
      return await Producto.findById(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
  }

  // Actualizar producto
  static async update(id, productoData) {
    try {
      const { nombre, codigo, precio, stock, stockMinimo, categoria_id, proveedor_id } = productoData;
      
      // Verificar si el producto existe
      const existingProducto = await Producto.findById(id);
      if (!existingProducto) {
        throw new Error('Producto no encontrado');
      }

      // Verificar si el código ya existe en otro producto
      if (codigo !== existingProducto.codigo) {
        const codigoExists = await Producto.findByCodigo(codigo);
        if (codigoExists && codigoExists.id !== id) {
          throw new Error('Ya existe otro producto con este código');
        }
      }

      // Actualizar producto
      await query(
        'UPDATE productos SET nombre = ?, codigo = ?, precio = ?, stock = ?, stockMinimo = ?, categoria_id = ?, proveedor_id = ? WHERE id = ?',
        [nombre, codigo, precio, stock, stockMinimo, categoria_id, proveedor_id, id]
      );

      // Retornar el producto actualizado
      return await Producto.findById(id);
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }

  // Actualizar solo el stock del producto
  static async updateStock(id, nuevoStock) {
    try {
      // Verificar si el producto existe
      const producto = await Producto.findById(id);
      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      // Actualizar stock
      await query(
        'UPDATE productos SET stock = ? WHERE id = ?',
        [nuevoStock, id]
      );

      // Retornar el producto actualizado
      return await Producto.findById(id);
    } catch (error) {
      throw new Error(`Error al actualizar stock: ${error.message}`);
    }
  }

  // Reducir stock del producto (para ventas)
  static async reduceStock(id, cantidad) {
    try {
      const producto = await Producto.findById(id);
      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      if (producto.stock < cantidad) {
        throw new Error('Stock insuficiente');
      }

      const nuevoStock = producto.stock - cantidad;
      return await Producto.updateStock(id, nuevoStock);
    } catch (error) {
      throw new Error(`Error al reducir stock: ${error.message}`);
    }
  }

  // Aumentar stock del producto (para cancelaciones o devoluciones)
  static async increaseStock(id, cantidad) {
    try {
      const producto = await Producto.findById(id);
      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      const nuevoStock = producto.stock + cantidad;
      return await Producto.updateStock(id, nuevoStock);
    } catch (error) {
      throw new Error(`Error al aumentar stock: ${error.message}`);
    }
  }

  // Eliminar producto
  static async delete(id) {
    try {
      // Verificar si el producto existe
      const producto = await Producto.findById(id);
      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      // Verificar si el producto tiene ventas asociadas
      const ventas = await query(
        'SELECT COUNT(*) as count FROM venta_detalles WHERE producto_id = ?',
        [id]
      );

      if (ventas[0].count > 0) {
        throw new Error('No se puede eliminar el producto porque tiene ventas asociadas');
      }

      // Eliminar producto
      await query('DELETE FROM productos WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }

  // Obtener productos por categoría
  static async findByCategoria(categoria_id) {
    try {
      const productos = await query(`
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          pr.nombre as proveedor_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
        WHERE p.categoria_id = ?
        ORDER BY p.nombre ASC
      `, [categoria_id]);
      return productos.map(producto => new Producto(producto));
    } catch (error) {
      throw new Error(`Error al obtener productos por categoría: ${error.message}`);
    }
  }

  // Obtener productos por proveedor
  static async findByProveedor(proveedor_id) {
    try {
      const productos = await query(`
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          pr.nombre as proveedor_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
        WHERE p.proveedor_id = ?
        ORDER BY p.nombre ASC
      `, [proveedor_id]);
      return productos.map(producto => new Producto(producto));
    } catch (error) {
      throw new Error(`Error al obtener productos por proveedor: ${error.message}`);
    }
  }

  // Verificar si tiene stock suficiente
  hasStock(cantidad = 1) {
    return this.stock >= cantidad;
  }

  // Verificar si está en stock bajo
  isLowStock() {
    return this.stock <= this.stockMinimo;
  }
}

export default Producto;