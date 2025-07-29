import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.email = data.email;
    this.password = data.password;
    this.rol = data.rol;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Obtener todos los usuarios
  static async findAll() {
    try {
      const users = await query(
        'SELECT id, nombre, email, rol, created_at, updated_at FROM usuarios ORDER BY created_at DESC'
      );
      return users.map(user => new User(user));
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    try {
      const users = await query(
        'SELECT id, nombre, email, rol, created_at, updated_at FROM usuarios WHERE id = ?',
        [id]
      );
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      const users = await query(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
      );
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Error al buscar usuario por email: ${error.message}`);
    }
  }

  // Crear nuevo usuario
  static async create(userData) {
    try {
      const { nombre, email, password, rol = 'vendedor' } = userData;
      
      // Verificar si el email ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar usuario
      const result = await query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        [nombre, email, hashedPassword, rol]
      );

      // Obtener el usuario creado
      return await User.findById(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  // Actualizar usuario
  static async update(id, userData) {
    try {
      const { nombre, email, password, rol } = userData;
      
      // Verificar si el usuario existe
      const existingUser = await User.findById(id);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar si el email ya existe en otro usuario
      if (email !== existingUser.email) {
        const emailExists = await User.findByEmail(email);
        if (emailExists && emailExists.id !== id) {
          throw new Error('El email ya está registrado por otro usuario');
        }
      }

      let updateQuery = 'UPDATE usuarios SET nombre = ?, email = ?, rol = ?';
      let params = [nombre, email, rol];

      // Solo actualizar contraseña si se proporciona
      if (password && password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateQuery += ', password = ?';
        params.push(hashedPassword);
      }

      updateQuery += ' WHERE id = ?';
      params.push(id);

      await query(updateQuery, params);

      // Retornar el usuario actualizado
      return await User.findById(id);
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  // Eliminar usuario
  static async delete(id) {
    try {
      // Verificar si el usuario existe
      const user = await User.findById(id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Eliminar usuario
      await query('DELETE FROM usuarios WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }

  // Verificar contraseña
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      throw new Error(`Error al verificar contraseña: ${error.message}`);
    }
  }

  // Método para obtener datos sin contraseña
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

export default User;