// import mysql from 'mysql2/promise';
// import bcrypt from 'bcryptjs';
// import dotenv from 'dotenv';

// dotenv.config();

// console.log('🚀 Iniciando setup simplificado...');

// // Configuración de conexión
// const config = {
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   charset: 'utf8mb4'
// };

// const dbName = process.env.DB_NAME || 'ferreteria_db';

// async function runSetup() {
//   let connection;
  
//   try {
//     // 1. Conectar sin especificar base de datos
//     console.log('📡 Conectando a MySQL...');
//     connection = await mysql.createConnection(config);
//     console.log('✅ Conectado a MySQL');

//     // 2. Crear base de datos
//     console.log(`🗄️ Creando base de datos ${dbName}...`);
//     await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
//     console.log('✅ Base de datos creada/verificada');

//     // 3. Usar la base de datos
//     await connection.execute(`USE \`${dbName}\``);
//     console.log('✅ Usando base de datos');

//     // 4. Crear tablas
//     console.log('📊 Creando tablas...');

//     // Tabla usuarios
//     await connection.execute(`
//       CREATE TABLE IF NOT EXISTS usuarios (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         nombre VARCHAR(100) NOT NULL,
//         email VARCHAR(100) UNIQUE NOT NULL,
//         password VARCHAR(255) NOT NULL,
//         rol ENUM('admin', 'vendedor') DEFAULT 'vendedor',
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
//     `);
//     console.log('  ✅ Tabla usuarios');

//     // Tabla proveedores
//     await connection.execute(`
//       CREATE TABLE IF NOT EXISTS proveedores (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         nombre VARCHAR(100) NOT NULL,
//         contacto VARCHAR(100) NOT NULL,
//         telefono VARCHAR(20) NOT NULL,
//         email VARCHAR(100) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
//     `);
//     console.log('  ✅ Tabla proveedores');

//     // Tabla categorias
//     await connection.execute(`
//       CREATE TABLE IF NOT EXISTS categorias (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         nombre VARCHAR(100) NOT NULL,
//         descripcion TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
//     `);
//     console.log('  ✅ Tabla categorias');

//     // Tabla productos
//     await connection.execute(`
//       CREATE TABLE IF NOT EXISTS productos (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         nombre VARCHAR(200) NOT NULL,
//         codigo VARCHAR(50) UNIQUE NOT NULL,
//         precio DECIMAL(10,2) NOT NULL,
//         stock INT NOT NULL DEFAULT 0,
//         stockMinimo INT NOT NULL DEFAULT 0,
//         categoria_id INT,
//         proveedor_id INT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
//         FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
//     `);
//     console.log('  ✅ Tabla productos');

//     // Tabla ventas
//     await connection.execute(`
//       CREATE TABLE IF NOT EXISTS ventas (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         vendedor VARCHAR(100) NOT NULL,
//         total DECIMAL(10,2) NOT NULL,
//         estado ENUM('completada', 'cancelada') DEFAULT 'completada',
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
//     `);
//     console.log('  ✅ Tabla ventas');

//     // Tabla venta_detalles
//     await connection.execute(`
//       CREATE TABLE IF NOT EXISTS venta_detalles (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         venta_id INT NOT NULL,
//         producto_id INT NOT NULL,
//         cantidad INT NOT NULL,
//         precio DECIMAL(10,2) NOT NULL,
//         subtotal DECIMAL(10,2) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
//         FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
//     `);
//     console.log('  ✅ Tabla venta_detalles');

//     // Tabla cortes_caja
//     await connection.execute(`
//       CREATE TABLE IF NOT EXISTS cortes_caja (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         responsable VARCHAR(100) NOT NULL,
//         ventasCompletadas INT NOT NULL DEFAULT 0,
//         ventasCanceladas INT NOT NULL DEFAULT 0,
//         totalIngresos DECIMAL(10,2) NOT NULL DEFAULT 0,
//         productosVendidos INT NOT NULL DEFAULT 0,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
//     `);
//     console.log('  ✅ Tabla cortes_caja');

//     // 5. Verificar si ya hay datos
//     const [existing] = await connection.execute('SELECT COUNT(*) as count FROM usuarios');
//     if (existing[0].count > 0) {
//       console.log('⚠️  Ya existen datos, omitiendo inserción...');
//     } else {
//       // 6. Insertar datos de prueba
//       console.log('📦 Insertando datos de prueba...');

//       // Usuarios
//       const adminPass = await bcrypt.hash('admin123', 10);
//       const juanPass = await bcrypt.hash('juan123', 10);
//       const mariaPass = await bcrypt.hash('maria123', 10);

//       await connection.execute(`
//         INSERT INTO usuarios (nombre, email, password, rol) VALUES 
//         ('Admin', 'admin@ferreteria.com', ?, 'admin'),
//         ('Juan Pérez', 'juan@ferreteria.com', ?, 'vendedor'),
//         ('María García', 'maria@ferreteria.com', ?, 'vendedor')
//       `, [adminPass, juanPass, mariaPass]);
//       console.log('  ✅ Usuarios insertados');

//       // Proveedores
//       await connection.execute(`
//         INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES 
//         ('Ferretería Central', 'Carlos López', '555-0001', 'contacto@ferreteria-central.com'),
//         ('Distribuidora México', 'Ana Martínez', '555-0002', 'ventas@distribuidora-mexico.com'),
//         ('Herramientas del Norte', 'Roberto Silva', '555-0003', 'info@herramientas-norte.com')
//       `);
//       console.log('  ✅ Proveedores insertados');

//       // Categorías
//       await connection.execute(`
//         INSERT INTO categorias (nombre, descripcion) VALUES 
//         ('Herramientas', 'Herramientas manuales y eléctricas'),
//         ('Tornillería', 'Tornillos, tuercas, arandelas'),
//         ('Pintura', 'Pinturas, barnices, esmaltes'),
//         ('Plomería', 'Tuberías, llaves, conexiones'),
//         ('Eléctrico', 'Cables, contactos, interruptores')
//       `);
//       console.log('  ✅ Categorías insertadas');

//       // Productos
//       await connection.execute(`
//         INSERT INTO productos (nombre, codigo, precio, stock, stockMinimo, categoria_id, proveedor_id) VALUES 
//         ('Martillo 16oz', 'MAR001', 45.50, 25, 10, 1, 1),
//         ('Destornillador Phillips', 'DES001', 12.50, 50, 20, 1, 2),
//         ('Tornillo 1/4" x 2"', 'TOR001', 0.75, 8, 50, 2, 3),
//         ('Pintura Blanca 1L', 'PIN001', 85.00, 3, 5, 3, 1),
//         ('Llave Inglesa 12"', 'LLA001', 125.00, 8, 10, 4, 2),
//         ('Cable Calibre 12', 'CAB001', 15.50, 100, 30, 5, 3)
//       `);
//       console.log('  ✅ Productos insertados');
//     }

//     console.log('🎉 ¡Setup completado exitosamente!');
//     console.log('');
//     console.log('📧 Credenciales de prueba:');
//     console.log('   Admin: admin@ferreteria.com / admin123');
//     console.log('   Vendedor: juan@ferreteria.com / juan123');
//     console.log('');

//   } catch (error) {
//     console.error('❌ Error durante el setup:', error.message);
//     process.exit(1);
//   } finally {
//     if (connection) {
//       await connection.end();
//       console.log('🔒 Conexión cerrada');
//     }
//   }
// }

// // Ejecutar
// runSetup().catch(console.error);

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Iniciando setup simplificado...');

// Configuración de conexión
const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  charset: 'utf8mb4'
};

const dbName = process.env.DB_NAME || 'ferreteria_db';

async function runSetup() {
  let connection;
  
  try {
    // 1. Conectar sin especificar base de datos
    console.log('📡 Conectando a MySQL...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado a MySQL');

    // 2. Crear base de datos
    console.log(`🗄️ Creando base de datos ${dbName}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ Base de datos creada/verificada');

    // 3. Cerrar conexión y reconectar a la base de datos específica
    await connection.end();
    
    const configWithDB = {
      ...config,
      database: dbName
    };
    
    console.log('🔄 Reconectando a la base de datos específica...');
    connection = await mysql.createConnection(configWithDB);
    console.log('✅ Conectado a la base de datos');

    // 4. Crear tablas
    console.log('📊 Creando tablas...');

    // Tabla usuarios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'vendedor') DEFAULT 'vendedor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('  ✅ Tabla usuarios');

    // Tabla proveedores
    await connection.query(`
      CREATE TABLE IF NOT EXISTS proveedores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        contacto VARCHAR(100) NOT NULL,
        telefono VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('  ✅ Tabla proveedores');

    // Tabla categorias
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('  ✅ Tabla categorias');

    // Tabla productos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        precio DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        stockMinimo INT NOT NULL DEFAULT 0,
        categoria_id INT,
        proveedor_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('  ✅ Tabla productos');

    // Tabla ventas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        vendedor VARCHAR(100) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        estado ENUM('completada', 'cancelada') DEFAULT 'completada',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('  ✅ Tabla ventas');

    // Tabla venta_detalles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS venta_detalles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        venta_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad INT NOT NULL,
        precio DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('  ✅ Tabla venta_detalles');

    // Tabla cortes_caja
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cortes_caja (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responsable VARCHAR(100) NOT NULL,
        ventasCompletadas INT NOT NULL DEFAULT 0,
        ventasCanceladas INT NOT NULL DEFAULT 0,
        totalIngresos DECIMAL(10,2) NOT NULL DEFAULT 0,
        productosVendidos INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('  ✅ Tabla cortes_caja');

    // 5. Verificar si ya hay datos
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM usuarios');
    if (existing[0].count > 0) {
      console.log('⚠️  Ya existen datos, omitiendo inserción...');
    } else {
      // 6. Insertar datos de prueba
      console.log('📦 Insertando datos de prueba...');

      // Usuarios
      const adminPass = await bcrypt.hash('admin123', 10);
      const juanPass = await bcrypt.hash('juan123', 10);
      const mariaPass = await bcrypt.hash('maria123', 10);

      await connection.execute(`
        INSERT INTO usuarios (nombre, email, password, rol) VALUES 
        ('Admin', 'admin@ferreteria.com', ?, 'admin'),
        ('Juan Pérez', 'juan@ferreteria.com', ?, 'vendedor'),
        ('María García', 'maria@ferreteria.com', ?, 'vendedor')
      `, [adminPass, juanPass, mariaPass]);
      console.log('  ✅ Usuarios insertados');

      // Proveedores
      await connection.execute(`
        INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES 
        ('Ferretería Central', 'Carlos López', '555-0001', 'contacto@ferreteria-central.com'),
        ('Distribuidora México', 'Ana Martínez', '555-0002', 'ventas@distribuidora-mexico.com'),
        ('Herramientas del Norte', 'Roberto Silva', '555-0003', 'info@herramientas-norte.com')
      `);
      console.log('  ✅ Proveedores insertados');

      // Categorías
      await connection.execute(`
        INSERT INTO categorias (nombre, descripcion) VALUES 
        ('Herramientas', 'Herramientas manuales y eléctricas'),
        ('Tornillería', 'Tornillos, tuercas, arandelas'),
        ('Pintura', 'Pinturas, barnices, esmaltes'),
        ('Plomería', 'Tuberías, llaves, conexiones'),
        ('Eléctrico', 'Cables, contactos, interruptores')
      `);
      console.log('  ✅ Categorías insertadas');

      // Productos
      await connection.execute(`
        INSERT INTO productos (nombre, codigo, precio, stock, stockMinimo, categoria_id, proveedor_id) VALUES 
        ('Martillo 16oz', 'MAR001', 45.50, 25, 10, 1, 1),
        ('Destornillador Phillips', 'DES001', 12.50, 50, 20, 1, 2),
        ('Tornillo 1/4" x 2"', 'TOR001', 0.75, 8, 50, 2, 3),
        ('Pintura Blanca 1L', 'PIN001', 85.00, 3, 5, 3, 1),
        ('Llave Inglesa 12"', 'LLA001', 125.00, 8, 10, 4, 2),
        ('Cable Calibre 12', 'CAB001', 15.50, 100, 30, 5, 3)
      `);
      console.log('  ✅ Productos insertados');
    }

    console.log('🎉 ¡Setup completado exitosamente!');
    console.log('');
    console.log('📧 Credenciales de prueba:');
    console.log('   Admin: admin@ferreteria.com / admin123');
    console.log('   Vendedor: juan@ferreteria.com / juan123');
    console.log('');

  } catch (error) {
    console.error('❌ Error durante el setup:', error.message);
    if (error.sql) {
      console.error('💻 SQL que falló:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Conexión cerrada');
    }
  }
}

// Ejecutar
runSetup().catch(console.error);