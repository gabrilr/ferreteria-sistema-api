import express from 'express';
import Categoria from '../models/Categoria.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(requireAuth);

// GET /api/categorias - Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
});

// GET /api/categorias/:id - Obtener categoría por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría inválido'
      });
    }

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      categoria
    });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría'
    });
  }
});

// POST /api/categorias - Crear nueva categoría
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    // Validar datos requeridos
    if (!nombre || !descripcion) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y descripción son requeridos'
      });
    }

    // Validar longitud del nombre
    if (nombre.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }

    const newCategoria = await Categoria.create({
      nombre: nombre.trim(),
      descripcion: descripcion.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      categoria: newCategoria
    });

  } catch (error) {
    console.error('Error al crear categoría:', error);
    
    if (error.message.includes('Ya existe una categoría con este nombre')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear categoría'
    });
  }
});

// PUT /api/categorias/:id - Actualizar categoría
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría inválido'
      });
    }

    // Validar datos requeridos
    if (!nombre || !descripcion) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y descripción son requeridos'
      });
    }

    // Validar longitud del nombre
    if (nombre.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }

    const updatedCategoria = await Categoria.update(id, {
      nombre: nombre.trim(),
      descripcion: descripcion.trim()
    });

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      categoria: updatedCategoria
    });

  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    
    if (error.message.includes('Categoría no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Ya existe otra categoría con este nombre')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría'
    });
  }
});

// DELETE /api/categorias/:id - Eliminar categoría
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría inválido'
      });
    }

    await Categoria.delete(id);

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    
    if (error.message.includes('Categoría no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('tiene productos asociados')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría'
    });
  }
});

// GET /api/categorias/:id/productos - Obtener productos de una categoría
router.get('/:id/productos', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría inválido'
      });
    }

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const productos = await categoria.getProductos();

    res.json({
      success: true,
      categoria: categoria.nombre,
      productos
    });

  } catch (error) {
    console.error('Error al obtener productos de categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos de la categoría'
    });
  }
});

export default router;