import { query } from '../config/database.js';

class Categoria {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Obtener todas las categorías
  static async findAll() {
    try {
      const categorias = await query(
        'SELECT * FROM categorias ORDER BY nombre ASC'
      );
      return categorias.map(categoria => new Categoria(categoria));
    } catch (error) {
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }
  }

  // Buscar categoría por ID
  static async findById(id) {
    try {
      const categorias = await query(
        'SELECT * FROM categorias WHERE id = ?',
        [id]
      );
      return categorias.length > 0 ? new Categoria(categorias[0]) : null;
    } catch (error) {
      throw new Error(`Error al buscar categoría: ${error.message}`);
    }
  }

  // Buscar categoría por nombre
  static async findByNombre(nombre) {
    try {
      const categorias = await query(
        'SELECT * FROM categorias WHERE nombre = ?',
        [nombre]
      );
      return categorias.length > 0 ? new Categoria(categorias[0]) : null;
    } catch (error) {
      throw new Error(`Error al buscar categoría por nombre: ${error.message}`);
    }
  }

  // Crear nueva categoría
  static async create(categoriaData) {
    try {
      const { nombre, descripcion } = categoriaData;
      
      // Verificar si el nombre ya existe
      const existingCategoria = await Categoria.findByNombre(nombre);
      if (existingCategoria) {
        throw new Error('Ya existe una categoría con este nombre');
      }

      // Insertar categoría
      const result = await query(
        'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
        [nombre, descripcion]
      );

      // Obtener la categoría creada
      return await Categoria.findById(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear categoría: ${error.message}`);
    }
  }

  // Actualizar categoría
  static async update(id, categoriaData) {
    try {
      const { nombre, descripcion } = categoriaData;
      
      // Verificar si la categoría existe
      const existingCategoria = await Categoria.findById(id);
      if (!existingCategoria) {
        throw new Error('Categoría no encontrada');
      }

      // Verificar si el nombre ya existe en otra categoría
      if (nombre !== existingCategoria.nombre) {
        const nombreExists = await Categoria.findByNombre(nombre);
        if (nombreExists && nombreExists.id !== id) {
          throw new Error('Ya existe otra categoría con este nombre');
        }
      }

      // Actualizar categoría
      await query(
        'UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?',
        [nombre, descripcion, id]
      );

      // Retornar la categoría actualizada
      return await Categoria.findById(id);
    } catch (error) {
      throw new Error(`Error al actualizar categoría: ${error.message}`);
    }
  }

  // Eliminar categoría
  static async delete(id) {
    try {
      // Verificar si la categoría existe
      const categoria = await Categoria.findById(id);
      if (!categoria) {
        throw new Error('Categoría no encontrada');
      }

      // Verificar si tiene productos asociados
      const productos = await query(
        'SELECT COUNT(*) as count FROM productos WHERE categoria_id = ?',
        [id]
      );

      if (productos[0].count > 0) {
        throw new Error('No se puede eliminar la categoría porque tiene productos asociados');
      }

      // Eliminar categoría
      await query('DELETE FROM categorias WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw new Error(`Error al eliminar categoría: ${error.message}`);
    }
  }

  // Obtener productos de la categoría
  async getProductos() {
    try {
      const productos = await query(
        'SELECT * FROM productos WHERE categoria_id = ?',
        [this.id]
      );
      return productos;
    } catch (error) {
      throw new Error(`Error al obtener productos de la categoría: ${error.message}`);
    }
  }

  // Contar productos de la categoría
  async countProductos() {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM productos WHERE categoria_id = ?',
        [this.id]
      );
      return result[0].count;
    } catch (error) {
      throw new Error(`Error al contar productos de la categoría: ${error.message}`);
    }
  }
}

export default Categoria;