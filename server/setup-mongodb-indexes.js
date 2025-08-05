const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

const createIndexes = async () => {
  try {
    console.log('MongoDB 인덱스 생성 시작...');
    
    await mongoClient.connect();
    const db = mongoClient.db('hyundai_inventory');
    
    // bluehands 컬렉션 인덱스 생성
    const bluehandsCollection = db.collection('bluehands');
    
    // 1. 위치 기반 검색을 위한 2dsphere 인덱스
    await bluehandsCollection.createIndex({
      location: "2dsphere"
    });
    console.log('✅ location 2dsphere 인덱스 생성 완료');
    
    // 2. 지역명 검색을 위한 인덱스
    await bluehandsCollection.createIndex({
      region_name: 1
    });
    console.log('✅ region_name 인덱스 생성 완료');
    
    // 3. 지점명 검색을 위한 인덱스
    await bluehandsCollection.createIndex({
      branch_name: 1
    });
    console.log('✅ branch_name 인덱스 생성 완료');
    
    // 4. 지점 코드 검색을 위한 인덱스
    await bluehandsCollection.createIndex({
      branch_code: 1
    });
    console.log('✅ branch_code 인덱스 생성 완료');
    
    // 5. 복합 인덱스 (지역명 + 지점명)
    await bluehandsCollection.createIndex({
      region_name: 1,
      branch_name: 1
    });
    console.log('✅ region_name + branch_name 복합 인덱스 생성 완료');
    
    // 6. 생성일자 인덱스
    await bluehandsCollection.createIndex({
      created_at: -1
    });
    console.log('✅ created_at 인덱스 생성 완료');
    
    // 7. 소스 필드 인덱스
    await bluehandsCollection.createIndex({
      source: 1
    });
    console.log('✅ source 인덱스 생성 완료');
    
    // 기존 데이터에 location 필드 추가 (위치 기반 검색을 위해)
    const updateResult = await bluehandsCollection.updateMany(
      { location: { $exists: false } },
      [
        {
          $set: {
            location: {
              type: "Point",
              coordinates: ["$longitude", "$latitude"]
            }
          }
        }
      ]
    );
    
    if (updateResult.modifiedCount > 0) {
      console.log(`✅ ${updateResult.modifiedCount}개 문서에 location 필드 추가 완료`);
    }
    
    console.log('🎉 모든 MongoDB 인덱스 생성 완료!');
    
  } catch (error) {
    console.error('MongoDB 인덱스 생성 오류:', error);
  } finally {
    await mongoClient.close();
  }
};

// 스크립트 실행
if (require.main === module) {
  createIndexes().then(() => {
    console.log('인덱스 생성 작업이 완료되었습니다.');
    process.exit(0);
  }).catch((error) => {
    console.error('인덱스 생성 중 오류 발생:', error);
    process.exit(1);
  });
}

module.exports = { createIndexes }; 