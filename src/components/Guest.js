import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

const GuestContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const LoginStatus = styled.div`
  color: #28a745;
  font-weight: bold;
  margin-right: 1rem;
  font-size: 14px;
`;

const LogoutButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #c82333;
  }
`;

const Content = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const LocationInfo = styled.div`
  background-color: #e3f2fd;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border-left: 4px solid #2196f3;
`;

const BranchInfo = styled.div`
  background-color: #f3e5f5;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border-left: 4px solid #9c27b0;
`;

const SummaryInfo = styled.div`
  background-color: #e8f5e8;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border-left: 4px solid #4caf50;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InventoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const TableHeader = styled.th`
  background-color: #f8f9fa;
  padding: 0.75rem;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
`;

const TableCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
`;

const LastSyncTime = styled.div`
  margin-top: 1rem;
  color: #6c757d;
  font-size: 0.9rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: #007bff;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border-left: 4px solid #dc3545;
`;

const DistanceBadge = styled.span`
  background-color: #17a2b8;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: 0.5rem;
`;

const BluehandsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const BluehandsTableHeader = styled.th`
  background-color: #007bff;
  color: white;
  padding: 0.75rem;
  text-align: left;
  border-bottom: 2px solid #0056b3;
`;

const BluehandsTableCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
`;

const BluehandsSection = styled.div`
  margin-top: 2rem;
`;

const BluehandsTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 1rem;
`;

function Guest() {
  const navigate = useNavigate();
  const [lastSync, setLastSync] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [branchInfo, setBranchInfo] = useState(null);
  const [summaryInfo, setSummaryInfo] = useState(null);
  const [bluehandsData, setBluehandsData] = useState([]);
  const [isLoadingBluehands, setIsLoadingBluehands] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [nearbyBranchesArray, setNearbyBranchesArray] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [userLocation, setUserLocation] = useState(null); // 사용하지 않으므로 삭제
  // const [nearbyBranchNames, setNearbyBranchNames] = useState([]); // 사용하지 않으므로 삭제
  // const [inventory, setInventory] = useState([]); // 사용하지 않으므로 삭제

  // 1. initializeLocation을 먼저 선언
  const initializeLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. IP 기반 위치 감지
      let location = await detectLocationByIP();
      
      // 2. 위치 감지 실패 시 기본값 설정
      if (!location) {
        location = {
          city: '서울특별시',
          region: '서울특별시',
          district: '강남구'
        };
      }

      // 3. 위치 기반 재고 조회
      await fetchInventoryByLocation(location);
      
    } catch (error) {
      console.error('위치 초기화 오류:', error);
      setError('위치를 확인하는 중 오류가 발생했습니다.');
      // 기본 위치로 재고 조회
      await fetchInventoryByLocation({ city: '서울특별시' });
    } finally {
      setLoading(false);
    }
  }, [fetchInventoryByLocation]);

  // 2. autoGetCurrentLocation을 그 아래에 선언
  const autoGetCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentAddress(null);
      // setUserLocation(null); // 삭제
      setCurrentLocation(null);
      
      if (!navigator.geolocation) {
        setError('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
        setLoading(false);
        initializeLocation();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = position.coords;
          setCurrentLocation({ latitude: coords.latitude, longitude: coords.longitude });
          setLoading(false);
          await getAddressFromCoordinates(coords.latitude, coords.longitude);
          const newLocation = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            address: currentAddress // 변환된 주소 추가
          };
          // setUserLocation(newLocation); // 삭제
          console.log('자동 위치 설정 완료:', newLocation);
          const branchesArray = await fetchBluehandsData(coords.latitude, coords.longitude);
          await fetchInventoryByLocation(newLocation, branchesArray);
        },
        (error) => {
          console.error('자동 위치 조회 실패:', error);
          initializeLocation();
        }
      );
    } catch (error) {
      console.error('자동 위치 조회 실패:', error);
      initializeLocation();
    }
  }, [initializeLocation, currentAddress, fetchInventoryByLocation, fetchBluehandsData]);

  useEffect(() => {
    autoGetCurrentLocation();
    initializeLocation();
  }, [autoGetCurrentLocation, initializeLocation]);

  const detectLocationByIP = async () => {
    try {
      // 프록시된 서버 API로 변경
      const resp = await fetch('/api/ip-location');
      const data = await resp.json();
      
      return {
        city: data.city || '서울특별시',
        region: data.region || '서울특별시',
        district: data.region_code || '강남구',
        country: data.country || 'KR',
        latitude: data.latitude,
        longitude: data.longitude
      };
    } catch (error) {
      console.error('IP 기반 위치 감지 실패:', error);
      return null;
    }
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    setCurrentAddress(null);

    if (!navigator.geolocation) {
      setLocationError('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setIsLoadingLocation(false);
        
        // 위치를 가져온 후 주소도 함께 가져오기
        await getAddressFromCoordinates(latitude, longitude);
        
        // 블루핸즈 데이터 먼저 조회 (지점명 저장을 위해)
        const branchesArray = await fetchBluehandsData(latitude, longitude);
        
        // 그 다음 재고 조회 (필터링된 데이터 표시)
        // fetchBluehandsData에서 반환된 배열을 전달
        await fetchInventoryByLocation({ latitude, longitude }, branchesArray);
      },
      (error) => {
        let errorMessage = '위치를 가져올 수 없습니다.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 정보 접근이 거부되었습니다.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
            break;
          default:
            errorMessage = '알 수 없는 오류가 발생했습니다.';
        }
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&accept-language=ko&addressdetails=1`
      );
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      const data = await response.json();
      let koreanAddress = '';
      if (data.address) {
        const addr = data.address;
        const state = addr.state || addr.province;
        const city = addr.city || addr.county;
        const district = addr.district || addr.suburb;
        const neighbourhood = addr.neighbourhood || addr.quarter;
        const components = [];
        if (state) components.push(state);
        if (district) components.push(district);
        if (neighbourhood) components.push(neighbourhood);
        if (components.length > 0) {
          koreanAddress = components.join(' ');
        }
      }
      if (!koreanAddress || koreanAddress.trim() === '') {
        const addressParts = data.display_name.split(', ');
        let foundCity = false;
        let foundDistrict = false;
        let foundNeighbourhood = false;
        const components = [];
        for (let i = 0; i < addressParts.length; i++) {
          const part = addressParts[i].trim();
          if (!foundCity && (part.includes('서울') || part.includes('부산') || part.includes('대구') || part.includes('인천') || part.includes('광주') || part.includes('대전') || part.includes('울산') || part.includes('세종'))) {
            components.push(part);
            foundCity = true;
          }
          if (foundCity && !foundDistrict && (part.includes('구') || part.includes('군'))) {
            components.push(part);
            foundDistrict = true;
          }
          if (foundDistrict && !foundNeighbourhood && (part.includes('동') || part.includes('읍') || part.includes('면'))) {
            components.push(part);
            foundNeighbourhood = true;
            break;
          }
        }
        if (components.length > 0) {
          koreanAddress = components.join(' ');
        }
      }
      if (!koreanAddress || koreanAddress.trim() === '') {
        const addressParts = data.display_name.split(', ');
        const components = [];
        for (let i = 0; i < addressParts.length; i++) {
          const part = addressParts[i].trim();
          if (part.includes('서울') || part.includes('부산') || part.includes('대구') || part.includes('인천') || part.includes('광주') || part.includes('대전') || part.includes('울산') || part.includes('세종') || part.includes('구') || part.includes('군') || part.includes('동') || part.includes('읍') || part.includes('면')) {
            components.push(part);
          }
        }
        if (components.length > 0) {
          koreanAddress = components.join(' ');
        }
      }
      if (koreanAddress) {
        const parts = koreanAddress.split(' ');
        const filteredParts = parts.filter(part =>
          !part.includes('리') && !part.includes('가') && !part.includes('로') &&
          !part.includes('길') && !part.includes('번지') && !part.includes('대한민국')
        );
        koreanAddress = filteredParts.join(' ');
      }
      if (!koreanAddress || koreanAddress.trim() === '') {
        koreanAddress = data.display_name.replace('대한민국', '').trim();
        if (koreanAddress.startsWith(',')) {
          koreanAddress = koreanAddress.substring(1).trim();
        }
      }
      setCurrentAddress(koreanAddress || '주소를 찾을 수 없습니다.');
    } catch (error) {
      setCurrentAddress(`주소 변환 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const clearLocation = () => {
    setCurrentLocation(null);
    setLocationError(null);
    setCurrentAddress(null);
    setNearbyBranchesArray([]); // 가장 가까운 지점들 배열 초기화
    setFilteredInventory([]); // 필터링된 재고 데이터 초기화
  };

  const fetchInventoryByLocation = async (location, branchesArray = null) => {
    try {
      const params = new URLSearchParams();
      if (location.district) params.append('district', location.district);
      if (location.city) params.append('city', location.city);
      if (location.region) params.append('region', location.region);
      if (location.latitude) params.append('latitude', location.latitude);
      if (location.longitude) params.append('longitude', location.longitude);

      const response = await axios.get(`http://localhost:5000/api/guest/inventory?${params}`);
      
      const allInventory = response.data.data;
      
      // 전달받은 배열 또는 현재 상태의 배열 사용
      const targetBranchesArray = branchesArray || nearbyBranchesArray;
      
      // 배열에 저장된 지점 정보를 기반으로 재고 필터링 및 거리 정보 추가
      console.log('=== fetchInventoryByLocation 시작 ===');
      console.log('전달받은 branchesArray:', branchesArray);
      console.log('현재 nearbyBranchesArray 상태:', nearbyBranchesArray);
      console.log('사용할 targetBranchesArray:', targetBranchesArray);
      console.log('targetBranchesArray 길이:', targetBranchesArray.length);
      
      if (targetBranchesArray.length > 0) {
        const processedInventory = [];
        
        console.log('=== 배열 처리 시작 ===');
        console.log('배열에 저장된 지점들:', targetBranchesArray);
        console.log('배열 크기:', targetBranchesArray.length);
        
        // 배열의 각 지점에 대해 재고 처리 (원본 배열 보존)
        targetBranchesArray.forEach((branch, index) => {
          console.log(`처리 중인 지점 ${index + 1}:`, branch.name, '거리:', branch.distance);
          
          // 해당 지점의 재고 찾기
          const branchInventory = allInventory.filter(item => item.location === branch.name);
          console.log(`${branch.name} 지점의 전체 재고:`, branchInventory);
          console.log(`${branch.name} 지점의 재고 수:`, branchInventory.length);
          
          // 거리 정보 추가
          const inventoryWithDistance = branchInventory.map(item => ({
            ...item,
            distance: branch.distance
          }));
          
          processedInventory.push(...inventoryWithDistance);
          console.log(`${branch.name} 지점 처리 완료. 추가된 재고:`, inventoryWithDistance);
        });
        
        console.log('=== 배열 처리 완료 ===');
        console.log('처리된 전체 재고:', processedInventory);
        
        // 거리순 정렬 (가까운 순서대로)
        processedInventory.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setFilteredInventory(processedInventory);
        console.log('최종 필터링된 재고 데이터:', processedInventory);
        console.log('총 처리된 재고 수:', processedInventory.length);
      } else {
        // 배열이 비어있으면 전체 재고 표시
        setFilteredInventory(allInventory);
        console.log('배열이 비어있어 전체 재고 데이터 표시:', allInventory);
      }
      
      setLocationInfo(response.data.location);
      setBranchInfo(response.data.branches);
      setSummaryInfo(response.data.summary);
      setLastSync(new Date().toLocaleString());
      
    } catch (error) {
      console.error('재고 조회 오류:', error);
      setError('재고 정보를 가져오는데 실패했습니다.');
    }
  };

  const fetchBluehandsData = async (latitude, longitude) => {
    setIsLoadingBluehands(true);
    try {
      console.log('블루핸즈 데이터 조회 시작:', { latitude, longitude });
      
      // Master 페이지 방식: 모든 블루핸즈 지점 목록을 가져와서 프론트엔드에서 거리 계산
      const response = await axios.get('http://localhost:5000/api/inventory/bluehands/list');
      
      console.log('블루핸즈 API 응답:', response.data);
      
      if (response.data && response.data.data) {
        let allBluehands = response.data.data;
        
        // 배열이 아니면 배열로 변환
        if (!Array.isArray(allBluehands)) {
          allBluehands = allBluehands ? [allBluehands] : [];
        }
        
        console.log('전체 블루핸즈 지점 수:', allBluehands.length);
        
        // 각 지점에 대해 거리 계산
        const bluehandsWithDistance = allBluehands
          .map(branch => ({
            ...branch,
            distance: (branch.latitude && branch.longitude) ?
              getDistanceFromLatLonInKm(
                latitude,
                longitude,
                Number(branch.latitude),
                Number(branch.longitude)
              ) : null
          }))
          .filter(branch => branch.distance !== null) // 거리 계산이 가능한 지점만
          .filter(branch => branch.distance <= 3.0) // 3km 이내만
          .sort((a, b) => a.distance - b.distance); // 거리순 정렬
        
        console.log('3km 이내 지점 수:', bluehandsWithDistance.length);
        console.log('3km 이내 지점들:', bluehandsWithDistance);
        
        // 최대 5개 지점 선택
        const selectedBranches = bluehandsWithDistance.slice(0, 5);
        
        console.log('선택된 지점들 (최대 5개):', selectedBranches);
        
        // 배열에 저장할 데이터 구성
        const newStack = selectedBranches.map(branch => ({
          name: branch.name,
          distance: branch.distance
        }));
        
        setBluehandsData(selectedBranches); // UI 표시용
        setNearbyBranchesArray(newStack);
        
        // 지점명만 추출하여 저장 (기존 호환성 유지)
        const branchNames = newStack.map(item => item.name);
        
        console.log('=== 상태 설정 완료 ===');
        console.log('설정된 nearbyBranchesArray:', newStack);
        console.log('설정된 nearbyBranchNames:', branchNames);
        console.log('배열 크기:', newStack.length);
        console.log('각 지점까지의 거리:', newStack.map(item => `${item.name}: ${item.distance.toFixed(2)}km`));
        
        if (bluehandsWithDistance.length === 0) {
          console.log('반경 3KM 내 블루핸즈 지점이 없습니다.');
          console.log('현재 위치:', { latitude, longitude });
          console.log('전체 블루핸즈 지점 수:', allBluehands.length);
        }
        
        // 배열 반환
        return newStack;
      }
    } catch (error) {
      console.error('블루핸즈 데이터 조회 오류:', error);
      console.error('오류 상세:', error.response?.data || error.message);
      setBluehandsData([]);
      setNearbyBranchesArray([]); // 오류 시 스택 초기화
      return []; // 오류 시 빈 배열 반환
    } finally {
      setIsLoadingBluehands(false);
    }
  };

  const getClassificationText = (classification) => {
    switch (classification) {
      case 1:
        return '전문블루핸즈';
      case 2:
        return '종합블루핸즈';
      case 3:
        return '하이테크센터';
      default:
        return '기타';
    }
  };

  // 거리 계산 함수 (Master 페이지 방식)
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구 반지름(km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <GuestContainer>
      <Header>
        <img src={process.env.PUBLIC_URL + '/image1-removebg-preview.png'} alt="현대자동차그룹 로고" style={{ height: '60px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <LoginStatus>
            {currentLocation && !isLoadingLocation
              ? `위도: ${currentLocation.latitude.toFixed(6)}, 경도: ${currentLocation.longitude.toFixed(6)}`
              : 'guest로 로그인 중입니다'}
          </LoginStatus>
          <button onClick={getCurrentLocation} style={{ padding: '0.5rem 1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            현재 위치로 조회
          </button>
          {currentLocation && (
            <button onClick={clearLocation} style={{ padding: '0.5rem 1rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              위치 초기화
            </button>
          )}
          <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
        </div>
      </Header>
      
      {isLoadingLocation && (
        <div style={{ color: '#007bff', margin: '1rem 0' }}>GPS 위치를 확인하고 있습니다...</div>
      )}
      {locationError && (
        <div style={{ color: '#dc3545', margin: '1rem 0' }}>{locationError}</div>
      )}
      {currentAddress && !isLoadingLocation && (
        <div style={{ color: '#28a745', margin: '1rem 0', fontWeight: 'bold' }}>�� {currentAddress}</div>
      )}
      
      <Content>
        <h2>내 주변 블루핸즈 지점 재고 현황</h2>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {loading ? (
          <LoadingSpinner>위치를 확인하고 재고를 불러오는 중...</LoadingSpinner>
        ) : (
          <>
            {locationInfo && (
              <LocationInfo>
                <strong>📍 현재 위치:</strong> {locationInfo.city} {locationInfo.district}
                {locationInfo.latitude && locationInfo.longitude && (
                  <span style={{ marginLeft: '1rem', color: '#666' }}>
                    (위도: {locationInfo.latitude}, 경도: {locationInfo.longitude})
                  </span>
                )}
              </LocationInfo>
            )}
            
            {branchInfo && branchInfo.length > 0 && (
              <BranchInfo>
                <strong>🏢 조회된 지점:</strong> {branchInfo.length}개
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {branchInfo.map((branch, index) => (
                    <span key={branch.code} style={{ marginRight: '1rem' }}>
                      {branch.name}
                      {branch.distance && (
                        <DistanceBadge>{branch.distance}</DistanceBadge>
                      )}
                    </span>
                  ))}
                </div>
              </BranchInfo>
            )}
            
            {summaryInfo && (
              <SummaryInfo>
                <div>
                  <strong>📊 요약 정보:</strong>
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <span>지점 수: {summaryInfo.totalBranches}개</span>
                  <span>품목 수: {summaryInfo.totalItems}개</span>
                  <span>총 수량: {summaryInfo.totalQuantity}개</span>
                </div>
              </SummaryInfo>
            )}
            
            {/* 필터링된 지점 정보 표시 */}
            {nearbyBranchesArray.length > 0 && (
              <div style={{ 
                marginBottom: '1rem', 
                padding: '1rem', 
                backgroundColor: '#e3f2fd', 
                borderRadius: '4px',
                border: '1px solid #2196f3'
              }}>
                <strong>📍 현재 조회 중인 지점 (3km 이내, 거리순 정렬):</strong>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {nearbyBranchesArray.map((branch, index) => (
                    <span key={index} style={{ 
                      marginRight: '1rem', 
                      padding: '0.25rem 0.5rem', 
                      backgroundColor: '#2196f3', 
                      color: 'white', 
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      {branch.name} ({branch.distance.toFixed(2)}km)
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                  총 {nearbyBranchesArray.length}개 지점의 재고만 표시됩니다. (현재 위치 기준 3km 이내, 가장 가까운 순서)
                </div>
              </div>
            )}
            
            <InventoryTable>
              <thead>
                <tr>
                  <TableHeader>파트명</TableHeader>
                  <TableHeader>수량</TableHeader>
                  <TableHeader>지점위치</TableHeader>
                  <TableHeader>등록일자</TableHeader>
                  <TableHeader>거리차이(km)</TableHeader>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id}>
                    <TableCell>{item.part_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {item.distance ? `${item.distance.toFixed(2)}km` : '-'}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </InventoryTable>
            
            {filteredInventory.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                해당 지역의 재고 정보가 없습니다.
              </div>
            )}
            
            {/* 블루핸즈 데이터 섹션 */}
            {locationInfo && (
              <BluehandsSection>
                <BluehandsTitle>
                  🏢 반경 3KM 내 블루핸즈 지점
                  {isLoadingBluehands && <span style={{ fontSize: '14px', color: '#007bff' }}>(조회 중...)</span>}
                </BluehandsTitle>
                
                {bluehandsData.length > 0 ? (
                  <BluehandsTable>
                    <thead>
                      <tr>
                        <BluehandsTableHeader>지점명</BluehandsTableHeader>
                        <BluehandsTableHeader>주소</BluehandsTableHeader>
                        <BluehandsTableHeader>전화번호</BluehandsTableHeader>
                        <BluehandsTableHeader>분류</BluehandsTableHeader>
                        <BluehandsTableHeader>거리</BluehandsTableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {bluehandsData.map((item) => (
                        <tr key={item.id}>
                          <BluehandsTableCell>{item.name}</BluehandsTableCell>
                          <BluehandsTableCell>{item.address}</BluehandsTableCell>
                          <BluehandsTableCell>{item.phone_number}</BluehandsTableCell>
                          <BluehandsTableCell>{getClassificationText(item.classification)}</BluehandsTableCell>
                          <BluehandsTableCell>{item.distance.toFixed(2)}km</BluehandsTableCell>
                        </tr>
                      ))}
                    </tbody>
                  </BluehandsTable>
                ) : (
                  !isLoadingBluehands && (
                    <NoDataMessage>
                      반경 3KM 내에 블루핸즈 지점이 없습니다.
                    </NoDataMessage>
                  )
                )}
              </BluehandsSection>
            )}
            
            {lastSync && (
              <LastSyncTime>
                마지막 업데이트: {lastSync}
              </LastSyncTime>
            )}
          </>
        )}
      </Content>
    </GuestContainer>
  );
}

export default Guest; 