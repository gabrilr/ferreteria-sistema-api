// import mysql from 'mysql2/promise';
// import dotenv from 'dotenv';

// dotenv.config();

// // Configuración de la base de datos
// const dbConfig = {
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT || 3306,
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'ferreteria_db',
//   charset: 'utf8mb4',
//   timezone: 'Z',
//   connectionLimit: 10,
//   acquireTimeout: 60000,
//   timeout: 60000
// };

// // Crear pool de conexiones
// const pool = mysql.createPool(dbConfig);

// // Función para ejecutar queries
// export const query = async (sql, params = []) => {
//   try {
//     const [rows] = await pool.execute(sql, params);
//     return rows;
//   } catch (error) {
//     console.error('Error en query:', error);
//     throw error;
//   }
// };

// // Función para inicializar la base de datos
// export const initDatabase = async () => {
//   try {
//     // Crear base de datos si no existe
//     const connection = await mysql.createConnection({
//       host: process.env.DB_HOST || 'localhost',
//       port: process.env.DB_PORT || 3306,
//       user: process.env.DB_USER || 'root',
//       password: process.env.DB_PASSWORD || ''
//     });

//     await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'ferreteria_db'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
//     await connection.end();

//     console.log('✅ Base de datos inicializada correctamente');
//   } catch (error) {
//     console.error('❌ Error al inicializar la base de datos:', error);
//     throw error;
//   }
// };

// // Función para cerrar el pool
// export const closePool = async () => {
//   try {
//     await pool.end();
//     console.log('🔐 Pool de conexiones cerrado');
//   } catch (error) {
//     console.error('❌ Error al cerrar el pool:', error);
//   }
// };

// // Test de conexión
// export const testConnection = async () => {
//   try {
//     const connection = await pool.getConnection();
//     console.log('✅ Conexión a MySQL establecida correctamente');
//     connection.release();
//     return true;
//   } catch (error) {
//     console.error('❌ Error de conexión a MySQL:', error);
//     return false;
//   }
// };

// export { pool };
// export default { pool, query, initDatabase, closePool, testConnection };


import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración básica para conexiones individuales
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  charset: 'utf8mb4'
};

// Configuración para el pool (solo opciones válidas para pools)
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ferreteria_db',
  charset: 'utf8mb4',
  connectionLimit: 10,
  queueLimit: 0,
  reconnect: true,
  multipleStatements: false
};

// Variable para el pool
let pool;

// Función para inicializar el pool
const initPool = () => {
  try {
    if (pool) {
      return pool; // Si ya existe, devolverlo
    }
    pool = mysql.createPool(poolConfig);
    console.log('✅ Pool de conexiones inicializado');
    return pool;
  } catch (error) {
    console.error('❌ Error al inicializar el pool:', error);
    throw error;
  }
};

// Función para ejecutar queries
export const query = async (sql, params = []) => {
  try {
    if (!pool) {
      initPool();
    }
    
    console.log(`📝 Ejecutando query: ${sql.substring(0, 50)}${sql.length > 50 ? '...' : ''}`);
    const [rows] = await pool.execute(sql, params);
    console.log(`✅ Query exitosa, ${Array.isArray(rows) ? rows.length : 'N/A'} filas afectadas`);
    return rows;
  } catch (error) {
    console.error('❌ Error en query:', error.message);
    console.error('📝 SQL:', sql);
    console.error('📋 Params:', params);
    throw error;
  }
};

// Función para inicializar la base de datos
export const initDatabase = async () => {
  try {
    console.log('🔧 Iniciando configuración de base de datos...');
    
    // Crear conexión individual para crear la base de datos
    console.log('📡 Conectando a MySQL...');
    const connection = await mysql.createConnection(connectionConfig);
    
    console.log('🗄️ Creando base de datos si no existe...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'ferreteria_db'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log(`✅ Base de datos '${process.env.DB_NAME || 'ferreteria_db'}' lista`);
    
    await connection.end();
    
    // Inicializar el pool después de crear la base de datos
    initPool();
    
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

// Función para cerrar el pool
export const closePool = async () => {
  try {
    if (pool) {
      console.log('🔄 Cerrando pool de conexiones...');
      await pool.end();
      pool = null;
      console.log('✅ Pool cerrado correctamente');
    }
  } catch (error) {
    console.error('❌ Error al cerrar el pool:', error);
  }
};

// Test de conexión
export const testConnection = async () => {
  try {
    if (!pool) {
      initPool();
    }
    
    console.log('🔌 Probando conexión del pool...');
    const connection = await pool.getConnection();
    
    // Hacer una query simple
    await connection.execute('SELECT 1');
    connection.release();
    
    console.log('✅ Conexión del pool exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión del pool:', error);
    return false;
  }
};

export { pool };
export default { query, initDatabase, closePool, testConnection };