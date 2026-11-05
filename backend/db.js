// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ie30216_db',
});

pool.on('connect', () => {
  console.log(' Conectado exitosamente a PostgreSQL (ie30216_db)');
});

pool.on('error', (err) => {
  console.error(' Error en la conexión con PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};