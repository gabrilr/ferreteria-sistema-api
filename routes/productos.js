import express from 'express';
import Producto from '../models/Producto.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(requireAuth);

// GET /api/productos - Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const { search, categoria, proveedor, lowStock } = req.query;
    
    let productos;
    
    if (lowStock === 'true') {
      productos = await Producto.findLowStock();
    } else if (search) {
      productos = await Producto.findByNombre(search);
    } else if (categoria) {
      productos = await Producto.findByCategoria(categoria);
    } else if (proveedor) {
      productos = await Producto.findByProveedor(proveedor);
    } else {
      productos = await Producto.findAll();
    }
    
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos'
    });
  }
});

// GET /api/productos/:id - Obtener producto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      producto
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto'
    });
  }
});

// POST /api/productos - Crear nuevo producto
router.post('/', async (req, res) => {
  try {
    const { nombre, codigo, precio, stock, stockMinimo, categoria_id, proveedor_id } = req.body;

    // Validar datos requeridos
    if (!nombre || !codigo || precio === undefined || stock === undefined || stockMinimo === undefined || !categoria_id || !proveedor_id) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Validar tipos de datos
    if (isNaN(precio) || isNaN(stock) || isNaN(stockMinimo) || isNaN(categoria_id) || isNaN(proveedor_id)) {
      return res.status(400).json({
        success: false,
        message: 'Precio, stock, stock mínimo, categoría y proveedor deben ser números'
      });
    }

    // Validar valores positivos
    if (precio < 0 || stock < 0 || stockMinimo < 0) {
      return res.status(400).json({
        success: false,
        message: 'Precio, stock y stock mínimo deben ser valores positivos'
      });
    }

    // Validar longitud del código
    if (codigo.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El código debe tener al menos 3 caracteres'
      });
    }

    const newProducto = await Producto.create({
      nombre: nombre.trim(),
      codigo: codigo.trim().toUpperCase(),
      precio: parseFloat(precio),
      stock: parseInt(stock),
      stockMinimo: parseInt(stockMinimo),
      categoria_id: parseInt(categoria_id),
      proveedor_id: parseInt(proveedor_id)
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      producto: newProducto
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    
    if (error.message.includes('Ya existe un producto con este código')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear producto'
    });
  }
});

// PUT /api/productos/:id - Actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, precio, stock, stockMinimo, categoria_id, proveedor_id } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    // Validar datos requeridos
    if (!nombre || !codigo || precio === undefined || stock === undefined || stockMinimo === undefined || !categoria_id || !proveedor_id) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Validar tipos de datos
    if (isNaN(precio) || isNaN(stock) || isNaN(stockMinimo) || isNaN(categoria_id) || isNaN(proveedor_id)) {
      return res.status(400).json({
        success: false,
        message: 'Precio, stock, stock mínimo, categoría y proveedor deben ser números'
      });
    }

    // Validar valores positivos
    if (precio < 0 || stock < 0 || stockMinimo < 0) {
      return res.status(400).json({
        success: false,
        message: 'Precio, stock y stock mínimo deben ser valores positivos'
      });
    }

    // Validar longitud del código
    if (codigo.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El código debe tener al menos 3 caracteres'
      });
    }

    const updatedProducto = await Producto.update(id, {
      nombre: nombre.trim(),
      codigo: codigo.trim().toUpperCase(),
      precio: parseFloat(precio),
      stock: parseInt(stock),
      stockMinimo: parseInt(stockMinimo),
      categoria_id: parseInt(categoria_id),
      proveedor_id: parseInt(proveedor_id)
    });

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      producto: updatedProducto
    });

  } catch (error) {
    console.error('Error al actualizar producto:', error);
    
    if (error.message.includes('Producto no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Ya existe otro producto con este código')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto'
    });
  }
});

// PATCH /api/productos/:id/stock - Actualizar solo el stock
router.patch('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    if (stock === undefined || isNaN(stock)) {
      return res.status(400).json({
        success: false,
        message: 'Stock debe ser un número'
      });
    }

    if (stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock debe ser un valor positivo'
      });
    }

    const updatedProducto = await Producto.updateStock(id, parseInt(stock));

    res.json({
      success: true,
      message: 'Stock actualizado exitosamente',
      producto: updatedProducto
    });

  } catch (error) {
    console.error('Error al actualizar stock:', error);
    
    if (error.message.includes('Producto no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar stock'
    });
  }
});

// DELETE /api/productos/:id - Eliminar producto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    await Producto.delete(id);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    
    if (error.message.includes('Producto no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('tiene ventas asociadas')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto'
    });
  }
});

export default router;