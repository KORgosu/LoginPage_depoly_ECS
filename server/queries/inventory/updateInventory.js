const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 5
});

class UpdateInventoryQuery {
  async execute(id, updateData) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 선택된 블루핸즈 지점의 주소 정보 가져오기
      let address = '';
      if (updateData.location) {
        const [branchResult] = await conn.query(
          'SELECT address FROM bluehands WHERE name = ?',
          [updateData.location]
        );
        if (branchResult.length > 0) {
          address = branchResult[0].address;
        }
      }
      
      // 날짜 형식 변환
      const updatedDate = new Date();
      
      const result = await conn.query(
        'UPDATE inventory SET name = ?, quantity = ?, location = ?, description = ?, address = ?, updated_at = ? WHERE id = ?',
        [
          updateData.name,
          updateData.quantity,
          updateData.location,
          updateData.description || '',
          address,
          updatedDate,
          id
        ]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Inventory item not found');
      }
      
      return {
        success: true,
        message: '재고가 성공적으로 수정되었습니다.'
      };
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = new UpdateInventoryQuery(); 