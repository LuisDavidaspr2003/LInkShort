// db.js
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Verificamos que todas las variables de entorno están cargadas correctamente
if (!process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_PASS || !process.env.DB_PORT) {
  console.error('Faltan una o más variables de entorno necesarias para la conexión a la base de datos');
  process.exit(1);  // Termina la aplicación si faltan variables
}



// Creamos la conexión con PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,  // Verificamos que la contraseña es un string
  port: parseInt(process.env.DB_PORT, 10) || 5433  // Nos aseguramos de que el puerto sea un número
});

module.exports = pool;
