const mariadb = require('mariadb');
const { MongoClient } = require('mongodb');
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

// bluehands 테이블에서 데이터 조회
const getBluehandsData = async () => {
  let conn;
  try {
    conn = await mariadbPool.getConnection();
    const query = `
      SELECT 
        id,
        name,
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
    console.error('bluehands 데이터 조회 오류:', error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

// 주소에서 지역명 추출
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

// bluehands 데이터를 MongoDB 형식으로 변환
const convertBluehandsToMongoFormat = (bluehandsData) => {
  return bluehandsData.map(item => ({
    _id: item.id,
    branch_code: `BRANCH_${String(item.id).padStart(3, '0')}`,
    branch_name: item.name,
    region_code: String(item.id),
    region_name: extractRegionFromAddress(item.address),
    address: item.address,
    phone_number: item.phone_number,
    latitude: item.latitude,
    longitude: item.longitude,
    created_at: item.created_at,
    updated_at: new Date(),
    source: 'bluehands'
  }));
};

// MongoDB에 bluehands 데이터 동기화
const syncBluehandsToMongoDB = async () => {
  try {
    console.log('bluehands 데이터를 MongoDB로 동기화 시작...');
    
    // 1. MariaDB에서 bluehands 데이터 조회
    const bluehandsData = await getBluehandsData();
    console.log(`총 ${bluehandsData.length}개의 bluehands 데이터를 발견했습니다.`);
    
    if (bluehandsData.length === 0) {
      console.log('bluehands 테이블에 데이터가 없습니다.');
      return { success: false, message: '동기화할 데이터가 없습니다.' };
    }
    
    // 2. MongoDB 연결
    await mongoClient.connect();
    const db = mongoClient.db('hyundai_inventory');
    const collection = db.collection('bluehands');
    
    // 3. 데이터 변환
    const mongoData = convertBluehandsToMongoFormat(bluehandsData);
    
    // 4. 기존 데이터 삭제 후 새 데이터 삽입
    await collection.deleteMany({});
    if (mongoData.length > 0) {
      await collection.insertMany(mongoData);
    }
    
    console.log('bluehands 데이터 MongoDB 동기화 완료!');
    
    return { 
      success: true, 
      message: '동기화 완료',
      count: mongoData.length 
    };
    
  } catch (error) {
    console.error('bluehands MongoDB 동기화 오류:', error);
    return { 
      success: false, 
      message: error.message 
    };
  } finally {
    await mongoClient.close();
  }
};

// MongoDB에서 bluehands 데이터 조회
const getBluehandsFromMongoDB = async () => {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('hyundai_inventory');
    const collection = db.collection('bluehands');
    
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error('MongoDB bluehands 데이터 조회 오류:', error);
    return [];
  } finally {
    await mongoClient.close();
  }
};

// 위치 기반 bluehands 데이터 조회 (MongoDB)
const getBluehandsByLocation = async (latitude, longitude, radius = 10) => {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('hyundai_inventory');
    const collection = db.collection('bluehands');
    
    // MongoDB의 $geoNear를 사용한 거리 기반 검색
    const pipeline = [
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: "distance",
          maxDistance: radius * 1000, // km를 m로 변환
          spherical: true
        }
      },
      {
        $sort: { distance: 1 }
      }
    ];
    
    const data = await collection.aggregate(pipeline).toArray();
    return data;
  } catch (error) {
    console.error('위치 기반 bluehands 조회 오류:', error);
    return [];
  } finally {
    await mongoClient.close();
  }
};

// 지역별 bluehands 데이터 조회 (MongoDB)
const getBluehandsByRegion = async (regionName) => {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('hyundai_inventory');
    const collection = db.collection('bluehands');
    
    const data = await collection.find({
      region_name: { $regex: regionName, $options: 'i' }
    }).toArray();
    
    return data;
  } catch (error) {
    console.error('지역별 bluehands 조회 오류:', error);
    return [];
  } finally {
    await mongoClient.close();
  }
};

// MongoDB 인덱스 생성 (위치 기반 검색을 위해)
const createMongoDBIndexes = async () => {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('hyundai_inventory');
    const collection = db.collection('bluehands');
    
    // 2dsphere 인덱스 생성 (위치 기반 검색용)
    await collection.createIndex({
      location: "2dsphere"
    });
    
    // 지역명 인덱스 생성
    await collection.createIndex({
      region_name: 1
    });
    
    console.log('MongoDB 인덱스 생성 완료');
  } catch (error) {
    console.error('MongoDB 인덱스 생성 오류:', error);
  } finally {
    await mongoClient.close();
  }
};

module.exports = {
  syncBluehandsToMongoDB,
  getBluehandsFromMongoDB,
  getBluehandsByLocation,
  getBluehandsByRegion,
  createMongoDBIndexes
}; 