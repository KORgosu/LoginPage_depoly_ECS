const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 5
});

class DeleteInventoryQuery {
  async execute(id) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const result = await conn.query('DELETE FROM inventory WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Inventory item not found');
      }
      
      return {
        success: true,
        message: '재고가 성공적으로 삭제되었습니다.'
      };
    } catch (error) {
      console.error('Error deleting inventory:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = new DeleteInventoryQuery(); 