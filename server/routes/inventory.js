const express = require('express');
const router = express.Router();
const createInventoryCommand = require('../commands/inventory/createInventory');
const getInventoryQuery = require('../queries/inventory/getInventory');
const updateInventoryQuery = require('../queries/inventory/updateInventory');
const deleteInventoryQuery = require('../queries/inventory/deleteInventory');

// 재고 조회
router.get('/', async (req, res) => {
  try {
    const inventory = await getInventoryQuery.execute();
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: '재고 조회 중 오류가 발생했습니다.' });
  }
});

// 블루핸즈 지점 조회 (반경 3KM 내)
router.get('/bluehands', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    
    console.log('블루핸즈 조회 요청:', { latitude, longitude });
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: '위도와 경도가 필요합니다.' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = 3; // 3KM 반경

    console.log('파싱된 좌표:', { lat, lng, radius });

    // 먼저 전체 블루핸즈 데이터 확인
    const allBluehandsQuery = 'SELECT * FROM bluehands LIMIT 5';
    const [allBluehands] = await req.app.locals.db.query(allBluehandsQuery);
    console.log('전체 블루핸즈 데이터 (상위 5개):', allBluehands);

    // Haversine 공식을 사용하여 거리 계산
    const query = `
      SELECT 
        id,
        name,
        address,
        phone_number,
        latitude,
        longitude,
        classification,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(latitude))
          )
        ) AS distance
      FROM bluehands
      HAVING distance <= ?
      ORDER BY distance ASC
    `;

    console.log('실행할 쿼리:', query);
    console.log('쿼리 파라미터:', [lat, lng, lat, radius]);

    const [rows] = await req.app.locals.db.execute(query, [lat, lng, lat, radius]);
    
    console.log('조회 결과:', rows);
    console.log('조회된 지점 수:', rows.length);
    
    // 항상 배열로 반환
    let data = rows;
    if (!Array.isArray(data)) {
      data = data ? [data] : [];
    }
    res.json({
      success: true,
      data,
      count: data.length,
      debug: {
        requestedLocation: { lat, lng },
        radius: radius,
        totalBluehandsInDB: allBluehands.length
      }
    });
  } catch (error) {
    console.error('Error fetching bluehands:', error);
    res.status(500).json({ error: '블루핸즈 지점 조회 중 오류가 발생했습니다.' });
  }
});

// 모든 블루핸즈 지점 조회 (디버깅용)
router.get('/bluehands/all', async (req, res) => {
  try {
    const query = 'SELECT * FROM bluehands ORDER BY id';
    const [rows] = await req.app.locals.db.execute(query);
    
    console.log('전체 블루핸즈 데이터:', rows);
    
    // 항상 배열로 반환
    let data = rows;
    if (!Array.isArray(data)) {
      data = data ? [data] : [];
    }
    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Error fetching all bluehands:', error);
    res.status(500).json({ error: '전체 블루핸즈 지점 조회 중 오류가 발생했습니다.' });
  }
});

// 모든 블루핸즈 지점 조회 (드롭다운용)
router.get('/bluehands/list', async (req, res) => {
  try {
    const query = `SELECT 
      id, 
      name AS name, 
      address AS address, 
      phone_number AS phone_number, 
      latitude AS latitude, 
      longitude AS longitude, 
      classification AS classification 
      FROM bluehands ORDER BY name`;
    // 쿼리 실행 방식 변경
    const listRows = await req.app.locals.db.query(query);
    console.log('블루핸즈 지점 목록:', listRows, Array.isArray(listRows), typeof listRows);
    let data = Array.isArray(listRows) ? listRows : (listRows ? [listRows] : []);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ error: '블루핸즈 지점 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 재고 생성
router.post('/', async (req, res) => {
  try {
    const result = await createInventoryCommand.execute(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating inventory:', error);
    res.status(500).json({ error: '재고 생성 중 오류가 발생했습니다.' });
  }
});

// 재고 업데이트
router.put('/:id', async (req, res) => {
  try {
    const result = await updateInventoryQuery.execute(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: '재고 업데이트 중 오류가 발생했습니다.' });
  }
});

// 재고 삭제
router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteInventoryQuery.execute(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({ error: '재고 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 