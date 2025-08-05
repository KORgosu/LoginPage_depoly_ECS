const express = require('express');
const cors = require('cors');
const { 
  createBranchTable, 
  syncBranchesFromBluehands, 
  getBranchesByRegion, 
  getBranchesByCoordinates,
  getAllBranches,
  getBranchDetail,
  getBranchStatistics,
  getBluehandsData
} = require('../models/branch');
const { 
  updateInventoryTable, 
  initializeInventoryData, 
  getInventoryByBranches,
  getInventoryStatistics
} = require('../models/inventory');
const {
  syncBluehandsToMongoDB,
  getBluehandsFromMongoDB,
  getBluehandsByLocation,
  getBluehandsByRegion,
  createMongoDBIndexes
} = require('../models/bluehands-sync');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 서버 시작 시 데이터베이스 초기화
const initializeDatabase = async () => {
  try {
    console.log('데이터베이스 초기화 시작...');
    
    // 지점 테이블 생성 및 bluehands 데이터 동기화
    await createBranchTable();
    await syncBranchesFromBluehands();
    
    // 재고 테이블 업데이트 및 데이터 초기화
    await updateInventoryTable();
    await initializeInventoryData();
    
    // bluehands 데이터를 MongoDB로 동기화
    await syncBluehandsToMongoDB();
    
    // MongoDB 인덱스 생성
    await createMongoDBIndexes();
    
    console.log('데이터베이스 초기화 완료!');
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
  }
};

// 위치 기반 재고 조회 API (MongoDB bluehands 데이터 사용)
app.get('/api/guest/inventory', async (req, res) => {
  try {
    const { region, city, district, latitude, longitude } = req.query;
    
    let targetBranches = [];
    
    // 1단계: 좌표 기반 검색 (우선순위)
    if (latitude && longitude) {
      targetBranches = await getBluehandsByLocation(
        parseFloat(latitude), 
        parseFloat(longitude), 
        10 // 10km 반경
      );
    }
    
    // 2단계: 지역명 기반 검색 (좌표 검색 결과가 없거나 지역명이 제공된 경우)
    if (targetBranches.length === 0) {
      if (district) {
        targetBranches = await getBluehandsByRegion(district);
      } else if (city) {
        targetBranches = await getBluehandsByRegion(city);
      } else if (region) {
        targetBranches = await getBluehandsByRegion(region);
      }
    }
    
    // 3단계: 결과가 없으면 기본 지역으로 검색
    if (targetBranches.length === 0) {
      targetBranches = await getBluehandsByRegion('서울특별시');
    }
    
    // 4단계: 해당 지점들의 재고 조회 (MariaDB에서)
    const branchCodes = targetBranches.map(branch => branch.branch_code);
    const inventory = await getInventoryByBranches(branchCodes);
    
    // 5단계: 응답 데이터 구성
    const responseData = {
      data: inventory,
      location: {
        region: region || '서울특별시',
        city: city || '서울특별시',
        district: district || '강남구',
        latitude: latitude,
        longitude: longitude
      },
      branches: targetBranches.map(branch => ({
        code: branch.branch_code,
        name: branch.branch_name,
        region: branch.region_name,
        address: branch.address,
        phone: branch.phone_number,
        distance: branch.distance ? `${(branch.distance / 1000).toFixed(2)}km` : null
      })),
      summary: {
        totalBranches: targetBranches.length,
        totalItems: inventory.length,
        totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0)
      }
    };
    
    res.json(responseData);
    
  } catch (error) {
    console.error('재고 조회 오류:', error);
    res.status(500).json({ 
      error: '재고 조회에 실패했습니다.',
      message: error.message 
    });
  }
});

// bluehands 데이터 MongoDB 동기화 API
app.post('/api/sync/bluehands', async (req, res) => {
  try {
    const result = await syncBluehandsToMongoDB();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        count: result.count
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('bluehands 동기화 오류:', error);
    res.status(500).json({
      success: false,
      message: '동기화에 실패했습니다.'
    });
  }
});

// MongoDB에서 bluehands 데이터 조회 API
app.get('/api/bluehands/mongodb', async (req, res) => {
  try {
    const { region, latitude, longitude, radius } = req.query;
    
    let bluehandsData;
    
    if (latitude && longitude) {
      // 위치 기반 검색
      bluehandsData = await getBluehandsByLocation(
        parseFloat(latitude), 
        parseFloat(longitude), 
        radius ? parseFloat(radius) : 10
      );
    } else if (region) {
      // 지역별 검색
      bluehandsData = await getBluehandsByRegion(region);
    } else {
      // 전체 데이터 조회
      bluehandsData = await getBluehandsFromMongoDB();
    }
    
    res.json({
      data: bluehandsData,
      count: bluehandsData.length,
      source: 'MongoDB'
    });
    
  } catch (error) {
    console.error('MongoDB bluehands 조회 오류:', error);
    res.status(500).json({ error: 'bluehands 데이터 조회에 실패했습니다.' });
  }
});

// 지점 목록 조회 API
app.get('/api/branches', async (req, res) => {
  try {
    const { region, city, district } = req.query;
    
    let branches;
    if (district) {
      branches = await getBranchesByRegion(district);
    } else if (city) {
      branches = await getBranchesByRegion(city);
    } else if (region) {
      branches = await getBranchesByRegion(region);
    } else {
      branches = await getAllBranches();
    }
    
    res.json({ 
      data: branches,
      count: branches.length,
      filters: { region, city, district }
    });
    
  } catch (error) {
    console.error('지점 조회 오류:', error);
    res.status(500).json({ error: '지점 조회에 실패했습니다.' });
  }
});

// 지점 상세 정보 조회 API
app.get('/api/branches/:branchCode', async (req, res) => {
  try {
    const { branchCode } = req.params;
    const branch = await getBranchDetail(branchCode);
    
    if (!branch) {
      return res.status(404).json({ error: '지점을 찾을 수 없습니다.' });
    }
    
    res.json({ 
      data: branch
    });
    
  } catch (error) {
    console.error('지점 상세 조회 오류:', error);
    res.status(500).json({ error: '지점 상세 조회에 실패했습니다.' });
  }
});

// 지역별 지점 통계 API
app.get('/api/branches/statistics/regions', async (req, res) => {
  try {
    const statistics = await getBranchStatistics();
    
    res.json({ 
      data: statistics,
      totalRegions: statistics.length,
      totalBranches: statistics.reduce((sum, stat) => sum + stat.branch_count, 0)
    });
    
  } catch (error) {
    console.error('지점 통계 조회 오류:', error);
    res.status(500).json({ error: '지점 통계 조회에 실패했습니다.' });
  }
});

// 지역별 지점 검색 API
app.get('/api/branches/search/regions', async (req, res) => {
  try {
    const { q } = req.query; // 검색어
    
    if (!q) {
      return res.status(400).json({ error: '검색어를 입력해주세요.' });
    }
    
    const allBranches = await getAllBranches();
    const filteredBranches = allBranches.filter(branch => 
      branch.branch_name.includes(q) ||
      branch.region_name.includes(q) ||
      branch.address.includes(q)
    );
    
    res.json({ 
      data: filteredBranches,
      count: filteredBranches.length,
      searchTerm: q
    });
    
  } catch (error) {
    console.error('지점 검색 오류:', error);
    res.status(500).json({ error: '지점 검색에 실패했습니다.' });
  }
});

// bluehands 원본 데이터 조회 API
app.get('/api/bluehands', async (req, res) => {
  try {
    const bluehandsData = await getBluehandsData();
    
    res.json({ 
      data: bluehandsData,
      count: bluehandsData.length,
      source: 'bluehands table'
    });
    
  } catch (error) {
    console.error('bluehands 데이터 조회 오류:', error);
    res.status(500).json({ error: 'bluehands 데이터 조회에 실패했습니다.' });
  }
});

// 재고 통계 API
app.get('/api/inventory/statistics', async (req, res) => {
  try {
    const statistics = await getInventoryStatistics();
    
    res.json({ 
      data: statistics
    });
    
  } catch (error) {
    console.error('재고 통계 조회 오류:', error);
    res.status(500).json({ error: '재고 통계 조회에 실패했습니다.' });
  }
});

// 위치 감지 API (IP 기반)
app.get('/api/location/detect', async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // IP 기반 위치 감지 (실제 구현에서는 더 정확한 서비스 사용)
    const locationData = {
      ip: clientIP,
      city: '서울특별시',
      region: '서울특별시',
      district: '강남구',
      country: 'KR',
      latitude: 37.5665,
      longitude: 127.0080
    };
    
    res.json(locationData);
    
  } catch (error) {
    console.error('위치 감지 오류:', error);
    res.status(500).json({ error: '위치 감지에 실패했습니다.' });
  }
});

// 데이터베이스 상태 확인 API
app.get('/api/health', async (req, res) => {
  try {
    const branches = await getAllBranches();
    const inventory = await getInventoryStatistics();
    const bluehandsData = await getBluehandsData();
    const mongoBluehands = await getBluehandsFromMongoDB();
    
    res.json({
      status: 'healthy',
      database: {
        branches: branches.length,
        inventory: inventory.total_items || 0,
        bluehands: bluehandsData.length,
        mongoBluehands: mongoBluehands.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('상태 확인 오류:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

// 서버 시작
app.listen(port, async () => {
  console.log(`API Gateway가 포트 ${port}에서 실행 중입니다.`);
  console.log('📍 bluehands 테이블 데이터를 활용한 지점 기반 시스템');
  console.log('🔄 MariaDB → MongoDB 직접 동기화 구현');
  
  // 데이터베이스 초기화
  await initializeDatabase();
});

module.exports = app; 