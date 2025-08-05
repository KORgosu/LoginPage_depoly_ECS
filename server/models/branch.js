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

// bluehands 테이블에서 지점 정보 조회
const getBranchesFromBluehands = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT 
        id,
        name as branch_name,
        address,
        phone_number,
        latitude,
        longitude,
        created_at
      FROM bluehands 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY name
    `;
    const rows = await conn.query(query);
    return rows;
  } catch (error) {
    console.error('bluehands 테이블 조회 오류:', error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

// 지점별 지역 정보 추출 (주소에서 지역명 파싱)
const extractRegionFromAddress = (address) => {
  // 주소에서 지역명 추출 로직
  const addressParts = address.split(' ');
  
  // 시/도 단위 추출
  for (let i = 0; i < addressParts.length; i++) {
    const part = addressParts[i];
    if (part.includes('시') || part.includes('도') || part.includes('특별자치시')) {
      // 구 단위도 함께 추출
      if (i + 1 < addressParts.length && addressParts[i + 1].includes('구')) {
        return `${part} ${addressParts[i + 1]}`;
      }
      return part;
    }
  }
  
  return '기타';
};

// 지점 정보를 branches 테이블 형식으로 변환
const convertBluehandsToBranches = (bluehandsData) => {
  return bluehandsData.map((item, index) => {
    const regionName = extractRegionFromAddress(item.address);
    return {
      branch_code: `BRANCH_${String(item.id).padStart(3, '0')}`,
      branch_name: item.branch_name,
      region_code: String(item.id),
      region_name: regionName,
      address: item.address,
      phone_number: item.phone_number,
      latitude: item.latitude,
      longitude: item.longitude,
      original_id: item.id
    };
  });
};

// 지점 정보 테이블 생성 (기존 branches 테이블과 호환)
const createBranchTable = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS branches (
        branch_code VARCHAR(20) PRIMARY KEY,
        branch_name VARCHAR(100) NOT NULL,
        region_code VARCHAR(20) NOT NULL,
        region_name VARCHAR(100) NOT NULL,
        address VARCHAR(200) NOT NULL,
        phone_number VARCHAR(20),
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        original_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await conn.query(createTableQuery);
    console.log('지점 정보 테이블이 생성되었습니다.');
    
  } catch (error) {
    console.error('지점 테이블 생성 오류:', error);
  } finally {
    if (conn) conn.release();
  }
};

// bluehands 데이터를 branches 테이블로 동기화
const syncBranchesFromBluehands = async () => {
  let conn;
  try {
    console.log('bluehands 테이블에서 지점 데이터를 동기화합니다...');
    
    // bluehands 테이블에서 데이터 조회
    const bluehandsData = await getBranchesFromBluehands();
    console.log(`총 ${bluehandsData.length}개의 지점을 발견했습니다.`);
    
    if (bluehandsData.length === 0) {
      console.log('bluehands 테이블에 데이터가 없습니다.');
      return;
    }
    
    // 데이터 변환
    const branchesData = convertBluehandsToBranches(bluehandsData);
    
    conn = await pool.getConnection();
    
    // 기존 branches 테이블 데이터 삭제
    await conn.query('DELETE FROM branches');
    
    // 새로운 데이터 삽입
    for (const branch of branchesData) {
      await conn.query(`
        INSERT INTO branches 
        (branch_code, branch_name, region_code, region_name, address, phone_number, latitude, longitude, original_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [branch.branch_code, branch.branch_name, branch.region_code, 
           branch.region_name, branch.address, branch.phone_number, 
           branch.latitude, branch.longitude, branch.original_id]);
    }
    
    console.log('지점 데이터 동기화가 완료되었습니다.');
    
  } catch (error) {
    console.error('지점 데이터 동기화 오류:', error);
  } finally {
    if (conn) conn.release();
  }
};

// 지점 조회 함수들
const getBranchesByRegion = async (regionName) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT * FROM branches 
      WHERE region_name LIKE ? AND is_active = TRUE
      ORDER BY branch_name
    `;
    const rows = await conn.query(query, [`%${regionName}%`]);
    return rows;
  } catch (error) {
    console.error('지역별 지점 조회 오류:', error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

const getBranchesByCoordinates = async (latitude, longitude, radius = 10) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT *, 
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
         cos(radians(longitude) - radians(?)) + 
         sin(radians(?)) * sin(radians(latitude)))) AS distance
      FROM branches 
      WHERE is_active = TRUE
      HAVING distance <= ?
      ORDER BY distance
    `;
    const rows = await conn.query(query, [latitude, longitude, latitude, radius]);
    return rows;
  } catch (error) {
    console.error('좌표별 지점 조회 오류:', error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

const getAllBranches = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = 'SELECT * FROM branches WHERE is_active = TRUE ORDER BY region_name, branch_name';
    const rows = await conn.query(query);
    return rows;
  } catch (error) {
    console.error('전체 지점 조회 오류:', error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

// 지점별 상세 정보 조회
const getBranchDetail = async (branchCode) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = 'SELECT * FROM branches WHERE branch_code = ? AND is_active = TRUE';
    const rows = await conn.query(query, [branchCode]);
    return rows[0] || null;
  } catch (error) {
    console.error('지점 상세 조회 오류:', error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

// 지역별 지점 통계
const getBranchStatistics = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT 
        region_name,
        COUNT(*) as branch_count,
        GROUP_CONCAT(branch_name) as branch_names
      FROM branches 
      WHERE is_active = TRUE
      GROUP BY region_name
      ORDER BY branch_count DESC
    `;
    const rows = await conn.query(query);
    return rows;
  } catch (error) {
    console.error('지점 통계 조회 오류:', error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

// bluehands 테이블 직접 조회 (원본 데이터)
const getBluehandsData = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = 'SELECT * FROM bluehands ORDER BY name';
    const rows = await conn.query(query);
    return rows;
  } catch (error) {
    console.error('bluehands 데이터 조회 오류:', error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  createBranchTable,
  syncBranchesFromBluehands,
  getBranchesByRegion,
  getBranchesByCoordinates,
  getAllBranches,
  getBranchDetail,
  getBranchStatistics,
  getBluehandsData,
  getBranchesFromBluehands
}; 