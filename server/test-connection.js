const mariadb = require('mariadb');
const { MongoClient } = require('mongodb');
const { syncBluehandsToMongoDB, getBluehandsFromMongoDB } = require('./models/bluehands-sync');
require('dotenv').config();

// MariaDB 연결 풀 생성
const mariadbPool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'hyundai_inventory',
  connectionLimit: 5
});

// MongoDB 연결
const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

// MariaDB bluehands 테이블 구조 확인
const checkMariaDBStructure = async () => {
  let conn;
  try {
    console.log('\n=== MariaDB bluehands 테이블 구조 확인 ===');
    conn = await mariadbPool.getConnection();
    
    // 테이블 구조 확인
    const structure = await conn.query(`
      DESCRIBE bluehands
    `);
    console.log('MariaDB bluehands 테이블 구조:');
    structure.forEach(field => {
      console.log(`  ${field.Field}: ${field.Type} ${field.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });
    
    // 샘플 데이터 확인
    const sampleData = await conn.query(`
      SELECT * FROM bluehands 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL 
      LIMIT 3
    `);
    console.log('\nMariaDB 샘플 데이터:');
    sampleData.forEach((row, index) => {
      console.log(`  레코드 ${index + 1}:`, {
        id: row.id,
        name: row.name,
        address: row.address,
        phone_number: row.phone_number,
        latitude: row.latitude,
        longitude: row.longitude
      });
    });
    
    return { success: true, structure, sampleData };
  } catch (error) {
    console.error('MariaDB 구조 확인 오류:', error);
    return { success: false, error: error.message };
  } finally {
    if (conn) conn.release();
  }
};

// MongoDB bluehands 컬렉션 구조 확인
const checkMongoDBStructure = async () => {
  try {
    console.log('\n=== MongoDB bluehands 컬렉션 구조 확인 ===');
    await mongoClient.connect();
    const db = mongoClient.db('hyundai_inventory');
    const collection = db.collection('bluehands');
    
    // 컬렉션 통계
    const stats = await db.command({ collStats: 'bluehands' });
    console.log('MongoDB 컬렉션 통계:', {
      count: stats.count,
      size: stats.size,
      avgObjSize: stats.avgObjSize
    });
    
    // 샘플 데이터 확인
    const sampleData = await collection.find({}).limit(3).toArray();
    console.log('\nMongoDB 샘플 데이터:');
    sampleData.forEach((doc, index) => {
      console.log(`  문서 ${index + 1}:`, {
        _id: doc._id,
        branch_code: doc.branch_code,
        branch_name: doc.branch_name,
        region_name: doc.region_name,
        address: doc.address,
        phone_number: doc.phone_number,
        latitude: doc.latitude,
        longitude: doc.longitude,
        source: doc.source
      });
    });
    
    return { success: true, stats, sampleData };
  } catch (error) {
    console.error('MongoDB 구조 확인 오류:', error);
    return { success: false, error: error.message };
  } finally {
    await mongoClient.close();
  }
};

// 속성 매핑 검증
const validatePropertyMapping = async () => {
  try {
    console.log('\n=== 속성 매핑 검증 ===');
    
    // MariaDB 데이터 조회
    let conn = await mariadbPool.getConnection();
    const mariaData = await conn.query(`
      SELECT id, name, address, phone_number, latitude, longitude, created_at
      FROM bluehands 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL 
      LIMIT 1
    `);
    conn.release();
    
    if (mariaData.length === 0) {
      console.log('MariaDB에 검증할 데이터가 없습니다.');
      return { success: false, message: '데이터 없음' };
    }
    
    const mariaRecord = mariaData[0];
    console.log('MariaDB 원본 데이터:', mariaRecord);
    
    // MongoDB 데이터 조회
    await mongoClient.connect();
    const db = mongoClient.db('hyundai_inventory');
    const collection = db.collection('bluehands');
    const mongoData = await collection.find({ _id: mariaRecord.id }).toArray();
    await mongoClient.close();
    
    if (mongoData.length === 0) {
      console.log('MongoDB에 해당 데이터가 없습니다. 동기화를 실행합니다...');
      const syncResult = await syncBluehandsToMongoDB();
      if (syncResult.success) {
        console.log('동기화 완료. 다시 확인합니다...');
        await mongoClient.connect();
        const mongoDataAfterSync = await collection.find({ _id: mariaRecord.id }).toArray();
        await mongoClient.close();
        
        if (mongoDataAfterSync.length > 0) {
          const mongoRecord = mongoDataAfterSync[0];
          console.log('MongoDB 동기화된 데이터:', mongoRecord);
          
          // 매핑 검증
          const mappingValidation = {
            id_to_id: mariaRecord.id === mongoRecord._id,
            name_to_branch_name: mariaRecord.name === mongoRecord.branch_name,
            address_to_address: mariaRecord.address === mongoRecord.address,
            phone_to_phone: mariaRecord.phone_number === mongoRecord.phone_number,
            lat_to_lat: mariaRecord.latitude === mongoRecord.latitude,
            lng_to_lng: mariaRecord.longitude === mongoRecord.longitude,
            has_branch_code: !!mongoRecord.branch_code,
            has_region_name: !!mongoRecord.region_name,
            has_source: mongoRecord.source === 'bluehands'
          };
          
          console.log('\n속성 매핑 검증 결과:');
          Object.entries(mappingValidation).forEach(([key, value]) => {
            console.log(`  ${key}: ${value ? '✅' : '❌'}`);
          });
          
          return { success: true, validation: mappingValidation };
        }
      }
    } else {
      const mongoRecord = mongoData[0];
      console.log('MongoDB 기존 데이터:', mongoRecord);
      
      // 매핑 검증
      const mappingValidation = {
        id_to_id: mariaRecord.id === mongoRecord._id,
        name_to_branch_name: mariaRecord.name === mongoRecord.branch_name,
        address_to_address: mariaRecord.address === mongoRecord.address,
        phone_to_phone: mariaRecord.phone_number === mongoRecord.phone_number,
        lat_to_lat: mariaRecord.latitude === mongoRecord.latitude,
        lng_to_lng: mariaRecord.longitude === mongoRecord.longitude,
        has_branch_code: !!mongoRecord.branch_code,
        has_region_name: !!mongoRecord.region_name,
        has_source: mongoRecord.source === 'bluehands'
      };
      
      console.log('\n속성 매핑 검증 결과:');
      Object.entries(mappingValidation).forEach(([key, value]) => {
        console.log(`  ${key}: ${value ? '✅' : '❌'}`);
      });
      
      return { success: true, validation: mappingValidation };
    }
    
    return { success: false, message: '검증 실패' };
  } catch (error) {
    console.error('속성 매핑 검증 오류:', error);
    return { success: false, error: error.message };
  }
};

// 전체 연결 테스트 실행
const runConnectionTest = async () => {
  console.log('🔍 MariaDB ↔ MongoDB 속성 연결 상태 확인 시작...\n');
  
  try {
    // 1. MariaDB 구조 확인
    const mariaResult = await checkMariaDBStructure();
    
    // 2. MongoDB 구조 확인
    const mongoResult = await checkMongoDBStructure();
    
    // 3. 속성 매핑 검증
    const mappingResult = await validatePropertyMapping();
    
    console.log('\n=== 전체 테스트 결과 요약 ===');
    console.log(`MariaDB 연결: ${mariaResult.success ? '✅' : '❌'}`);
    console.log(`MongoDB 연결: ${mongoResult.success ? '✅' : '❌'}`);
    console.log(`속성 매핑: ${mappingResult.success ? '✅' : '❌'}`);
    
    if (mappingResult.validation) {
      const allValid = Object.values(mappingResult.validation).every(v => v);
      console.log(`모든 속성 매핑: ${allValid ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('연결 테스트 실행 오류:', error);
  } finally {
    await mariadbPool.end();
    process.exit(0);
  }
};

// 스크립트 실행
runConnectionTest(); 