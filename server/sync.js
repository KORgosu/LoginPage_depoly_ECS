const { Kafka, Partitioners } = require('kafkajs');
const mariadb = require('mariadb');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MariaDB 연결 풀 생성
const mariadbPool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 5
});

// MongoDB 연결
const mongoClient = new MongoClient(process.env.MONGODB_URI);

// Kafka 설정
const kafka = new Kafka({
  clientId: 'inventory-sync',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});
const consumer = kafka.consumer({ groupId: 'inventory-sync-group' });

// MariaDB에서 데이터를 읽어 Kafka로 전송
async function syncToKafka() {
  let conn;
  try {
    conn = await mariadbPool.getConnection();
    const rows = await conn.query('SELECT * FROM inventory');
    
    await producer.connect();
    await producer.send({
      topic: 'inventory-updates',
      messages: [
        { value: JSON.stringify(rows) }
      ]
    });
    
    console.log('Data synced to Kafka successfully');
  } catch (err) {
    console.error('Error syncing to Kafka:', err);
  } finally {
    if (conn) conn.release();
    await producer.disconnect();
  }
}

// Kafka에서 데이터를 읽어 MongoDB로 동기화
async function syncToMongoDB() {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('hyundai_inventory');
    const collection = db.collection('inventory');

    await consumer.connect();
    await consumer.subscribe({ topic: 'inventory-updates', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ message }) => {
        const inventoryData = JSON.parse(message.value.toString());
        
        // MongoDB 컬렉션 비우기
        await collection.deleteMany({});
        
        // 새 데이터 삽입
        if (inventoryData.length > 0) {
          await collection.insertMany(inventoryData);
        }
        
        console.log('Data synced to MongoDB successfully');
      }
    });
  } catch (err) {
    console.error('Error syncing to MongoDB:', err);
  }
}

// 주기적으로 동기화 실행 (5분마다)
setInterval(syncToKafka, 5 * 60 * 1000);

// 초기 동기화 실행
syncToKafka().then(() => {
  syncToMongoDB();
}); 