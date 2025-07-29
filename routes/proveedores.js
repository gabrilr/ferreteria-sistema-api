import express from 'express';
import Proveedor from '../models/Proveedor.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(requireAuth);

// GET /api/proveedores - Obtener todos los proveedores
router.get('/', async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll();
    res.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores'
    });
  }
});

// GET /api/proveedores/:id - Obtener proveedor por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proveedor inválido'
      });
    }

    const proveedor = await Proveedor.findById(id);
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      proveedor
    });
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor'
    });
  }
});

// POST /api/proveedores - Crear nuevo proveedor
router.post('/', async (req, res) => {
  try {
    const { nombre, contacto, telefono, email } = req.body;

    // Validar datos requeridos
    if (!nombre || !contacto || !telefono || !email) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    const newProveedor = await Proveedor.create({
      nombre: nombre.trim(),
      contacto: contacto.trim(),
      telefono: telefono.trim(),
      email: email.toLowerCase().trim()
    });

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      proveedor: newProveedor
    });

  } catch (error) {
    console.error('Error al crear proveedor:', error);
    
    if (error.message.includes('Ya existe un proveedor con este email')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear proveedor'
    });
  }
});

// PUT /api/proveedores/:id - Actualizar proveedor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto, telefono, email } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proveedor inválido'
      });
    }

    // Validar datos requeridos
    if (!nombre || !contacto || !telefono || !email) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    const updatedProveedor = await Proveedor.update(id, {
      nombre: nombre.trim(),
      contacto: contacto.trim(),
      telefono: telefono.trim(),
      email: email.toLowerCase().trim()
    });

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      proveedor: updatedProveedor
    });

  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    
    if (error.message.includes('Proveedor no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Ya existe otro proveedor con este email')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar proveedor'
    });
  }
});

// DELETE /api/proveedores/:id - Eliminar proveedor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proveedor inválido'
      });
    }

    await Proveedor.delete(id);

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    
    if (error.message.includes('Proveedor no encontrado')) {
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
      message: 'Error al eliminar proveedor'
    });
  }
});

export default router;