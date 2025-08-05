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

// 재고 테이블 수정 (bluehands 지점과 연결)
const updateInventoryTable = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // 기존 테이블에 컬럼 추가
    const alterQueries = [
      'ALTER TABLE inventory ADD COLUMN IF NOT EXISTS branch_code VARCHAR(20)',
      'ALTER TABLE inventory ADD COLUMN IF NOT EXISTS branch_name VARCHAR(100)',
      'ALTER TABLE inventory ADD COLUMN IF NOT EXISTS region_code VARCHAR(20)',
      'ALTER TABLE inventory ADD COLUMN IF NOT EXISTS region_name VARCHAR(100)',
      'ALTER TABLE inventory ADD COLUMN IF NOT EXISTS bluehands_id INT'
    ];
    
    for (const query of alterQueries) {
      try {
        await conn.query(query);
      } catch (error) {
        console.log('컬럼이 이미 존재합니다:', error.message);
      }
    }
    
    console.log('재고 테이블이 업데이트되었습니다.');
    
  } catch (error) {
    console.error('재고 테이블 업데이트 오류:', error);
  } finally {
    if (conn) conn.release();
  }
};

// bluehands 지점별 샘플 재고 데이터 생성
const initializeInventoryData = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // bluehands 테이블에서 지점 정보 조회
    const bluehandsData = await conn.query(`
      SELECT id, name, address 
      FROM bluehands 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY name
    `);
    
    if (bluehandsData.length === 0) {
      console.log('bluehands 테이블에 지점 데이터가 없습니다.');
      return;
    }
    
    // 기존 재고 데이터 삭제
    await conn.query('DELETE FROM inventory');
    
    // 지점별 샘플 재고 데이터 생성
    const inventoryData = [];
    
    bluehandsData.forEach((branch, index) => {
      // 각 지점당 2-3개의 샘플 부품 생성
      const sampleParts = [
        {
          part_number: `HY${String(branch.id).padStart(3, '0')}01`,
          part_name: '엔진 오일 필터',
          quantity: Math.floor(Math.random() * 200) + 50,
          location: `A-${branch.id}-1`
        },
        {
          part_number: `HY${String(branch.id).padStart(3, '0')}02`,
          part_name: '브레이크 패드',
          quantity: Math.floor(Math.random() * 150) + 30,
          location: `A-${branch.id}-2`
        },
        {
          part_number: `HY${String(branch.id).padStart(3, '0')}03`,
          part_name: '에어 필터',
          quantity: Math.floor(Math.random() * 100) + 20,
          location: `B-${branch.id}-1`
        }
      ];
      
      sampleParts.forEach(part => {
        inventoryData.push({
          ...part,
          branch_code: `BRANCH_${String(branch.id).padStart(3, '0')}`,
          branch_name: branch.name,
          region_code: String(branch.id),
          region_name: extractRegionFromAddress(branch.address),
          bluehands_id: branch.id
        });
      });
    });
    
    // 재고 데이터 삽입
    for (const item of inventoryData) {
      await conn.query(`
        INSERT INTO inventory 
        (part_number, part_name, quantity, location, branch_code, branch_name, region_code, region_name, bluehands_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [item.part_number, item.part_name, item.quantity, item.location,
           item.branch_code, item.branch_name, item.region_code, item.region_name, item.bluehands_id]);
    }
    
    console.log(`${inventoryData.length}개의 재고 데이터가 생성되었습니다.`);
    
  } catch (error) {
    console.error('재고 데이터 초기화 오류:', error);
  } finally {
    if (conn) conn.release();
  }
};

// 주소에서 지역명 추출 (branch.js와 동일한 로직)
const extractRegionFromAddress = (address) => {
  const addressParts = address.split(' ');
  
  for (let i = 0; i < addressParts.length; i++) {
    const part = addressParts[i];
    if (part.includes('시') || part.includes('도') || part.includes('특별자치시')) {
      if (i + 1 < addressParts.length && addressParts[i + 1].includes('구')) {
        return `${part} ${addressParts[i + 1]}`;
      }
      return part;
    }
  }
  
  return '기타';
};

// 지점별 재고 조회
const getInventoryByBranches = async (branchCodes) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    if (branchCodes.length === 0) {
      return [];
    }
    
    const placeholders = branchCodes.map(() => '?').join(',');
    const query = `
      SELECT * FROM inventory 
      WHERE branch_code IN (${placeholders})
      ORDER BY branch_name, part_number
    `;
    
    const rows = await conn.query(query, branchCodes);
    return rows;
  } catch (error) {
    console.error('지점별 재고 조회 오류:', error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

// 지역별 재고 조회
const getInventoryByRegion = async (regionName) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT * FROM inventory 
      WHERE region_name LIKE ?
      ORDER BY branch_name, part_number
    `;
    const rows = await conn.query(query, [`%${regionName}%`]);
    return rows;
  } catch (error) {
    console.error('지역별 재고 조회 오류:', error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

// 전체 재고 조회
const getAllInventory = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = 'SELECT * FROM inventory ORDER BY region_name, branch_name, part_number';
    const rows = await conn.query(query);
    return rows;
  } catch (error) {
    console.error('전체 재고 조회 오류:', error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

// bluehands ID로 재고 조회
const getInventoryByBluehandsId = async (bluehandsId) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT * FROM inventory 
      WHERE bluehands_id = ?
      ORDER BY part_number
    `;
    const rows = await conn.query(query, [bluehandsId]);
    return rows;
  } catch (error) {
    console.error('bluehands ID별 재고 조회 오류:', error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

// 재고 통계 조회
const getInventoryStatistics = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity) as total_quantity,
        COUNT(DISTINCT branch_code) as total_branches,
        COUNT(DISTINCT region_name) as total_regions
      FROM inventory
    `;
    const rows = await conn.query(query);
    return rows[0] || {};
  } catch (error) {
    console.error('재고 통계 조회 오류:', error);
    return {};
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  updateInventoryTable,
  initializeInventoryData,
  getInventoryByBranches,
  getInventoryByRegion,
  getAllInventory,
  getInventoryByBluehandsId,
  getInventoryStatistics
}; 