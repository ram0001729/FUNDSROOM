const { Pool } = require('pg');
require('dotenv').config();

let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('sslmode=require') && !connectionString.includes('uselibpqcompat=true')) {
  connectionString = connectionString.includes('?') 
    ? connectionString.replace('sslmode=require', 'sslmode=require&uselibpqcompat=true')
    : `${connectionString}?sslmode=require&uselibpqcompat=true`;
}

const poolConfig = connectionString
  ? { connectionString }
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
