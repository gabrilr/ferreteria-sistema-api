import { query } from '../config/database.js';

class Proveedor {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.contacto = data.contacto;
    this.telefono = data.telefono;
    this.email = data.email;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Obtener todos los proveedores
  static async findAll() {
    try {
      const proveedores = await query(
        'SELECT * FROM proveedores ORDER BY nombre ASC'
      );
      return proveedores.map(proveedor => new Proveedor(proveedor));
    } catch (error) {
      throw new Error(`Error al obtener proveedores: ${error.message}`);
    }
  }

  // Buscar proveedor por ID
  static async findById(id) {
    try {
      const proveedores = await query(
        'SELECT * FROM proveedores WHERE id = ?',
        [id]
      );
      return proveedores.length > 0 ? new Proveedor(proveedores[0]) : null;
    } catch (error) {
      throw new Error(`Error al buscar proveedor: ${error.message}`);
    }
  }

  // Buscar proveedor por email
  static async findByEmail(email) {
    try {
      const proveedores = await query(
        'SELECT * FROM proveedores WHERE email = ?',
        [email]
      );
      return proveedores.length > 0 ? new Proveedor(proveedores[0]) : null;
    } catch (error) {
      throw new Error(`Error al buscar proveedor por email: ${error.message}`);
    }
  }

  // Crear nuevo proveedor
  static async create(proveedorData) {
    try {
      const { nombre, contacto, telefono, email } = proveedorData;
      
      // Verificar si el email ya existe
      const existingProveedor = await Proveedor.findByEmail(email);
      if (existingProveedor) {
        throw new Error('Ya existe un proveedor con este email');
      }

      // Insertar proveedor
      const result = await query(
        'INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES (?, ?, ?, ?)',
        [nombre, contacto, telefono, email]
      );

      // Obtener el proveedor creado
      return await Proveedor.findById(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear proveedor: ${error.message}`);
    }
  }

  // Actualizar proveedor
  static async update(id, proveedorData) {
    try {
      const { nombre, contacto, telefono, email } = proveedorData;
      
      // Verificar si el proveedor existe
      const existingProveedor = await Proveedor.findById(id);
      if (!existingProveedor) {
        throw new Error('Proveedor no encontrado');
      }

      // Verificar si el email ya existe en otro proveedor
      if (email !== existingProveedor.email) {
        const emailExists = await Proveedor.findByEmail(email);
        if (emailExists && emailExists.id !== id) {
          throw new Error('Ya existe otro proveedor con este email');
        }
      }

      // Actualizar proveedor
      await query(
        'UPDATE proveedores SET nombre = ?, contacto = ?, telefono = ?, email = ? WHERE id = ?',
        [nombre, contacto, telefono, email, id]
      );

      // Retornar el proveedor actualizado
      return await Proveedor.findById(id);
    } catch (error) {
      throw new Error(`Error al actualizar proveedor: ${error.message}`);
    }
  }

  // Eliminar proveedor
  static async delete(id) {
    try {
      // Verificar si el proveedor existe
      const proveedor = await Proveedor.findById(id);
      if (!proveedor) {
        throw new Error('Proveedor no encontrado');
      }

      // Verificar si tiene productos asociados
      const productos = await query(
        'SELECT COUNT(*) as count FROM productos WHERE proveedor_id = ?',
        [id]
      );

      if (productos[0].count > 0) {
        throw new Error('No se puede eliminar el proveedor porque tiene productos asociados');
      }

      // Eliminar proveedor
      await query('DELETE FROM proveedores WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw new Error(`Error al eliminar proveedor: ${error.message}`);
    }
  }

  // Obtener productos del proveedor
  async getProductos() {
    try {
      const productos = await query(
        'SELECT * FROM productos WHERE proveedor_id = ?',
        [this.id]
      );
      return productos;
    } catch (error) {
      throw new Error(`Error al obtener productos del proveedor: ${error.message}`);
    }
  }
}

export default Proveedor;