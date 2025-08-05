const express = require('express');
const cors = require('cors');
const mariadb = require('mariadb');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// MariaDB 연결 풀 생성 (환경변수가 있을 때만)
let pool = null;
if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD) {
  pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'hyundai_inventory',
    connectionLimit: 5
  });
}

// MongoDB 연결 (환경변수가 있을 때만)
let mongoClient = null;
if (process.env.MONGODB_URI) {
  mongoClient = new MongoClient(process.env.MONGODB_URI);
}

app.use(cors());
app.use(express.json());

// MariaDB 연결을 app.locals에 설정 (pool이 있을 때만)
if (pool) {
  app.locals.db = pool;
}

// 재고 라우터 연결
const inventoryRouter = require('./routes/inventory');
app.use('/api/inventory', inventoryRouter);

// location 라우터 추가
const locationRouter = require('./routes/location');
app.use('/api', locationRouter);

// 데이터베이스 연결 테스트
app.get('/api/test', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'MariaDB 연결이 설정되지 않았습니다.' });
  }
  
  let conn;
  try {
    conn = await pool.getConnection();
    res.json({ message: '데이터베이스 연결 성공!' });
  } catch (err) {
    console.error('Error connecting to the database:', err);
    res.status(500).json({ error: '데이터베이스 연결 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 블루핸즈 데이터베이스 연결 테스트
app.get('/api/test-bluehands', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'MariaDB 연결이 설정되지 않았습니다.' });
  }
  
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT COUNT(*) as count FROM bluehands');
    res.json({ 
      message: '블루핸즈 데이터베이스 연결 성공!', 
      bluehandsCount: rows[0].count 
    });
  } catch (err) {
    console.error('Error connecting to bluehands database:', err);
    res.status(500).json({ error: '블루핸즈 데이터베이스 연결 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 재고 데이터 조회 (MariaDB)
app.get('/api/inventory', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'MariaDB 연결이 설정되지 않았습니다.' });
  }
  
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM inventory');
    res.json({ data: rows });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: 'Failed to fetch inventory data' });
  } finally {
    if (conn) conn.release();
  }
});

// 재고 데이터 추가
app.post('/api/inventory', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'MariaDB 연결이 설정되지 않았습니다.' });
  }
  
  let conn;
  try {
    const { part_number, part_name, quantity, location } = req.body;
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO inventory (part_number, part_name, quantity, location) VALUES (?, ?, ?, ?)',
      [part_number, part_name, quantity, location]
    );
    
    // 새로 추가된 데이터 조회
    const [newItem] = await conn.query(
      'SELECT * FROM inventory WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({ 
      message: '재고가 추가되었습니다.', 
      data: newItem 
    });
  } catch (err) {
    console.error('Error adding inventory:', err);
    res.status(500).json({ error: '재고 추가에 실패했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 재고 데이터 수정
app.put('/api/inventory/:id', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'MariaDB 연결이 설정되지 않았습니다.' });
  }
  
  let conn;
  try {
    const { id } = req.params;
    const { part_number, part_name, quantity, location } = req.body;
    conn = await pool.getConnection();
    await conn.query(
      'UPDATE inventory SET part_number = ?, part_name = ?, quantity = ?, location = ? WHERE id = ?',
      [part_number, part_name, quantity, location, id]
    );
    res.json({ message: '재고가 수정되었습니다.' });
  } catch (err) {
    console.error('Error updating inventory:', err);
    res.status(500).json({ error: '재고 수정에 실패했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 재고 데이터 삭제
app.delete('/api/inventory/:id', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'MariaDB 연결이 설정되지 않았습니다.' });
  }
  
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();
    await conn.query('DELETE FROM inventory WHERE id = ?', [id]);
    res.json({ message: '재고가 삭제되었습니다.' });
  } catch (err) {
    console.error('Error deleting inventory:', err);
    res.status(500).json({ error: '재고 삭제에 실패했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 게스트용 재고 데이터 조회 (MongoDB)
app.get('/api/guest/inventory', async (req, res) => {
  if (!mongoClient) {
    return res.status(503).json({ error: 'MongoDB 연결이 설정되지 않았습니다.' });
  }
  
  try {
    await mongoClient.connect();
    const db = mongoClient.db('hyundai_inventory');
    const collection = db.collection('inventory');
    const data = await collection.find({}).toArray();
    res.json({ data });
  } catch (err) {
    console.error('Error fetching inventory from MongoDB:', err);
    res.status(500).json({ error: 'Failed to fetch inventory data' });
  }
});

// 정적 파일 서빙 (React build 결과물)
app.use(express.static(require('path').join(__dirname, '../public')));

// SPA 라우팅 지원 (React Router 사용 시)
app.get('*', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../public/index.html'));
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
}); 