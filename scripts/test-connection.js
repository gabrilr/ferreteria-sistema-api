import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testBasicConnection() {
  console.log('🔍 Probando conexión básica a MySQL...');
  console.log(`📡 Host: ${process.env.DB_HOST}`);
  console.log(`🔌 Puerto: ${process.env.DB_PORT}`);
  console.log(`👤 Usuario: ${process.env.DB_USER}`);
  
  let connection;
  
  try {
    console.log('⏳ Intentando conectar...');
    
    // Timeout de 5 segundos para evitar que se cuelgue
    const connectionPromise = mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectTimeout: 5000,
      acquireTimeout: 5000,
      timeout: 5000
    });

    // Usar Promise.race para agregar timeout manual
    connection = await Promise.race([
      connectionPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de conexión (5 segundos)')), 5000)
      )
    ]);
    
    console.log('✅ Conectado a MySQL!');
    
    // Probar una query simple
    console.log('📊 Probando query básica...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query exitosa:', rows);
    
    // Mostrar versión de MySQL
    const [version] = await connection.execute('SELECT VERSION() as version');
    console.log('🔢 Versión de MySQL:', version[0].version);
    
    // Mostrar bases de datos
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('🗄️  Bases de datos disponibles:');
    databases.forEach(db => console.log(`   - ${db.Database}`));
    
    console.log('🎉 ¡Conexión exitosa!');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('🔧 MySQL no está respondiendo. Posibles causas:');
      console.error('   1. MySQL no está instalado o no está ejecutándose');
      console.error('   2. El puerto 3306 está bloqueado');
      console.error('   3. MySQL está configurado en otro puerto');
      console.error('');
      console.error('💡 Soluciones:');
      console.error('   - Verifica: net start | findstr MySQL');
      console.error('   - Inicia MySQL: net start mysql80 (o el nombre de tu servicio)');
      console.error('   - Verifica el puerto en MySQL Workbench o tu configuración');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('');
      console.error('🔧 Credenciales incorrectas:');
      console.error('   1. Verifica la contraseña en el archivo .env');
      console.error('   2. Verifica que el usuario "root" tenga permisos');
    } else if (error.message.includes('Timeout')) {
      console.error('');
      console.error('🔧 La conexión está tardando demasiado:');
      console.error('   1. MySQL puede estar sobrecargado');
      console.error('   2. Problemas de red o firewall');
      console.error('   3. MySQL configurado incorrectamente');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      console.log('🔒 Cerrando conexión...');
      await connection.end();
    }
    console.log('👋 Prueba completada');
  }
}

// Ejecutar la prueba
testBasicConnection().catch(console.error);