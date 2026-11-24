// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

const usaSSL =
  process.env.DB_SSL === 'true' ||
  Boolean(process.env.DATABASE_URL) ||
  (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST));

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: usaSSL ? { rejectUnauthorized: false } : false,
    }
  : {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'root',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'ie30216_db',
      ssl: usaSSL ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('Conectado exitosamente a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Error en la conexión con PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};