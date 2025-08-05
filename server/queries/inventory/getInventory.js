const mariadb = require('mariadb');
require('dotenv').config();

// MariaDB 연결 풀 생성
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 5
});

class GetInventoryQuery {
  async execute() {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query('SELECT * FROM inventory ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      console.error('Error in GetInventoryQuery:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = new GetInventoryQuery(); 