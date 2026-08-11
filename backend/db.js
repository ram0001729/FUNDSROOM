const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.PGUSER || 'erp_user',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'erp_db',
      password: process.env.PGPASSWORD || 'erp_password',
      port: process.env.PGPORT || 5432,
    };

const pool = new Pool(poolConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
};
