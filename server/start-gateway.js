const app = require('./gateway/index');

console.log('🚀 위치 기반 재고 관리 시스템 API Gateway를 시작합니다...');
console.log('📍 지점별 좌표 사전 저장 방식으로 구현되었습니다.');
console.log('🌐 서버가 실행 중입니다. http://localhost:5000');
console.log('📋 사용 가능한 API:');
console.log('   - GET /api/guest/inventory - 위치 기반 재고 조회');
console.log('   - GET /api/branches - 지점 목록 조회');
console.log('   - GET /api/location/detect - 위치 감지');
console.log('   - GET /api/health - 서버 상태 확인'); 