import { initDatabase, query, testConnection, closePool } from '../config/database.js';
import bcrypt from 'bcryptjs';

console.log('🔍 Iniciando script de configuración...');
console.log('📋 Variables de entorno cargadas:');
console.log(`   DB_HOST: ${process.env.DB_HOST || 'no definido'}`);
console.log(`   DB_PORT: ${process.env.DB_PORT || 'no definido'}`);
console.log(`   DB_USER: ${process.env.DB_USER || 'no definido'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'no definido'}`);
console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '[DEFINIDO]' : '[NO DEFINIDO]'}`);

// Función para crear las tablas
const createTables = async () => {
  try {
    console.log('📊 Creando tablas...');

    // Tabla de usuarios
    console.log('  • Creando tabla usuarios...');
    await query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'vendedor') DEFAULT 'vendedor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de proveedores
    console.log('  • Creando tabla proveedores...');
    await query(`
      CREATE TABLE IF NOT EXISTS proveedores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        contacto VARCHAR(100) NOT NULL,
        telefono VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de categorías
    console.log('  • Creando tabla categorias...');
    await query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de productos
    console.log('  • Creando tabla productos...');
    await query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de ventas
    console.log('  • Creando tabla ventas...');
    await query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        vendedor VARCHAR(100) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        estado ENUM('completada', 'cancelada') DEFAULT 'completada',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de detalles de venta
    console.log('  • Creando tabla venta_detalles...');
    await query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de cortes de caja
    console.log('  • Creando tabla cortes_caja...');
    await query(`
      CREATE TABLE IF NOT EXISTS cortes_caja (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responsable VARCHAR(100) NOT NULL,
        ventasCompletadas INT NOT NULL DEFAULT 0,
        ventasCanceladas INT NOT NULL DEFAULT 0,
        totalIngresos DECIMAL(10,2) NOT NULL DEFAULT 0,
        productosVendidos INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Todas las tablas creadas correctamente');
  } catch (error) {
    console.error('❌ Error al crear tablas:', error);
    throw error;
  }
};

// Función para insertar datos de prueba
const insertSampleData = async () => {
  try {
    console.log('📦 Insertando datos de prueba...');

    // Verificar si ya existen datos
    console.log('  • Verificando datos existentes...');
    const existingUsers = await query('SELECT COUNT(*) as count FROM usuarios');
    if (existingUsers[0].count > 0) {
      console.log('⚠️  Ya existen datos de usuarios, omitiendo inserción...');
      return;
    }

    // Usuarios de prueba
    console.log('  • Insertando usuarios...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const hashedPassword2 = await bcrypt.hash('juan123', 10);
    const hashedPassword3 = await bcrypt.hash('maria123', 10);

    await query(`
      INSERT INTO usuarios (nombre, email, password, rol) VALUES 
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?)
    `, [
      'Admin', 'admin@ferreteria.com', hashedPassword, 'admin',
      'Juan Pérez', 'juan@ferreteria.com', hashedPassword2, 'vendedor',
      'María García', 'maria@ferreteria.com', hashedPassword3, 'vendedor'
    ]);

    // Proveedores de prueba
    console.log('  • Insertando proveedores...');
    await query(`
      INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES 
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?)
    `, [
      'Ferretería Central', 'Carlos López', '555-0001', 'contacto@ferreteria-central.com',
      'Distribuidora México', 'Ana Martínez', '555-0002', 'ventas@distribuidora-mexico.com',
      'Herramientas del Norte', 'Roberto Silva', '555-0003', 'info@herramientas-norte.com'
    ]);

    // Categorías de prueba
    console.log('  • Insertando categorías...');
    await query(`
      INSERT INTO categorias (nombre, descripcion) VALUES 
      (?, ?),
      (?, ?),
      (?, ?),
      (?, ?),
      (?, ?)
    `, [
      'Herramientas', 'Herramientas manuales y eléctricas',
      'Tornillería', 'Tornillos, tuercas, arandelas',
      'Pintura', 'Pinturas, barnices, esmaltes',
      'Plomería', 'Tuberías, llaves, conexiones',
      'Eléctrico', 'Cables, contactos, interruptores'
    ]);

    // Productos de prueba
    console.log('  • Insertando productos...');
    await query(`
      INSERT INTO productos (nombre, codigo, precio, stock, stockMinimo, categoria_id, proveedor_id) VALUES 
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?)
    `, [
      'Martillo 16oz', 'MAR001', 45.50, 25, 10, 1, 1,
      'Destornillador Phillips', 'DES001', 12.50, 50, 20, 1, 2,
      'Tornillo 1/4" x 2"', 'TOR001', 0.75, 8, 50, 2, 3,
      'Pintura Blanca 1L', 'PIN001', 85.00, 3, 5, 3, 1,
      'Llave Inglesa 12"', 'LLA001', 125.00, 8, 10, 4, 2,
      'Cable Calibre 12', 'CAB001', 15.50, 100, 30, 5, 3
    ]);

    console.log('✅ Datos de prueba insertados correctamente');
  } catch (error) {
    console.error('❌ Error al insertar datos de prueba:', error);
    throw error;
  }
};

// Función principal para configurar la base de datos
export const setupDatabase = async () => {
  let success = false;
  
  try {
    console.log('🚀 Iniciando configuración de la base de datos...');
    
    // Verificar variables de entorno
    if (!process.env.DB_HOST || !process.env.DB_USER) {
      console.error('❌ Variables de entorno faltantes. Verifica tu archivo .env');
      console.error('   DB_HOST:', process.env.DB_HOST || 'FALTANTE');
      console.error('   DB_USER:', process.env.DB_USER || 'FALTANTE');
      process.exit(1);
    }

    console.log(`📡 Conectando a MySQL en ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`🗄️  Base de datos: ${process.env.DB_NAME || 'ferreteria_db'}`);
    
    // Inicializar base de datos
    console.log('🔧 Inicializando base de datos...');
    await initDatabase();
    console.log('✅ Base de datos inicializada');
    
    // Test de conexión
    console.log('🔌 Probando conexión...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    console.log('✅ Conexión establecida');
    
    // Crear tablas
    await createTables();
    
    // Insertar datos de prueba
    await insertSampleData();
    
    console.log('🎉 Base de datos configurada exitosamente');
    console.log('');
    console.log('📧 Credenciales de prueba:');
    console.log('   Admin: admin@ferreteria.com / admin123');
    console.log('   Vendedor: juan@ferreteria.com / juan123');
    console.log('');
    
    success = true;
    
  } catch (error) {
    console.error('💥 Error en la configuración:', error);
    if (error.code) {
      console.error(`   Código de error MySQL: ${error.code}`);
    }
    if (error.errno) {
      console.error(`   Número de error: ${error.errno}`);
    }
    if (error.sqlMessage) {
      console.error(`   Mensaje SQL: ${error.sqlMessage}`);
    }
    
    // Mostrar sugerencias según el tipo de error
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('🔧 Posibles soluciones:');
      console.error('   1. Verifica que MySQL esté ejecutándose');
      console.error('   2. Revisa la configuración de host y puerto en .env');
      console.error('   3. Verifica que no haya firewall bloqueando la conexión');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('');
      console.error('🔧 Error de autenticación:');
      console.error('   1. Verifica las credenciales en el archivo .env');
      console.error('   2. Asegúrate de que el usuario tenga permisos');
    }
    
    process.exit(1);
  } finally {
    console.log('🔄 Cerrando conexiones...');
    await closePool();
    console.log(success ? '👋 Configuración completada exitosamente' : '❌ Configuración falló');
  }
};

// Ejecutar si el script se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('📜 Ejecutando setup de base de datos...');
  setupDatabase().catch(error => {
    console.error('💀 Error fatal:', error);
    process.exit(1);
  });
}

export default { setupDatabase };