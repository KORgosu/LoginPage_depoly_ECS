import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const MasterContainer = styled.div`
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
  color: #007bff;
  font-weight: bold;
  margin-right: 1rem;
  font-size: 12px;
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

const CreateGuestButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 1rem;
  &:hover {
    background-color: #0056b3;
  }
`;

const DatabaseStatus = styled.div`
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  background-color: ${props => props.status === 'success' ? '#d4edda' : '#f8d7da'};
  color: ${props => props.status === 'success' ? '#155724' : '#721c24'};
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

const ActionButton = styled.button`
  padding: 0.25rem 0.5rem;
  margin: 0 0.25rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${props => props.type === 'edit' ? '#ffc107' : '#dc3545'};
  color: ${props => props.type === 'edit' ? '#000' : '#fff'};
  &:hover {
    background-color: ${props => props.type === 'edit' ? '#e0a800' : '#c82333'};
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 400px;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${props => props.primary ? '#007bff' : '#6c757d'};
  color: white;
  &:hover {
    background-color: ${props => props.primary ? '#0056b3' : '#5a6268'};
  }
`;

const AddButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 1rem;
  &:hover {
    background-color: #218838;
  }
`;

const TextLink = styled.span`
  color: #007bff;
  cursor: pointer;
  font-weight: 500;
  margin-left: 1rem;
  font-size: 12px;
  &:hover {
    text-decoration: underline;
    color: #0056b3;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  width: 200px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const SearchButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background-color: #0056b3;
  }
`;

const TableControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const LocationContainer = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #dee2e6;
`;

const LocationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const LocationTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #333;
`;

const LocationButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: ${props => props.primary ? '#007bff' : '#6c757d'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 0.5rem;
  &:hover {
    background-color: ${props => props.primary ? '#0056b3' : '#5a6268'};
  }
  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const LocationInfo = styled.div`
  font-size: 14px;
  color: #666;
  margin-top: 0.5rem;
`;

const LocationError = styled.div`
  color: #dc3545;
  font-size: 14px;
  margin-top: 0.5rem;
`;

const LocationLoading = styled.div`
  color: #007bff;
  font-size: 14px;
  margin-top: 0.5rem;
`;

function Master() {
  const navigate = useNavigate();
  const [dbStatus, setDbStatus] = useState(null);
  const [dbError, setDbError] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    part_name: '',
    quantity: '',
    location: ''
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [bluehandsList, setBluehandsList] = useState([]);
  const [isLoadingBluehandsList, setIsLoadingBluehandsList] = useState(false);

  useEffect(() => {
    testDatabaseConnection();
    fetchInventory();
    initializeMasterAccount();
    // 로그인 시 즉시 현재 위치 조회
    autoGetCurrentLocation();
    // 블루핸즈 지점 목록 가져오기
    fetchBluehandsList();
    // 페이지 타이틀 설정
    document.title = "현대자동차 통합 재고 관리";
  }, []);

  const autoGetCurrentLocation = useCallback(async () => {
    try {
      console.log('Master 페이지 자동 위치 조회 시작');
      
      if (!navigator.geolocation) {
        console.log('Geolocation이 지원되지 않습니다.');
        return;
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      setCurrentLocation({ latitude, longitude });
      console.log('Master 페이지 자동 위치 설정 완료:', { latitude, longitude });
      
      // 주소 변환
      await getAddressFromCoordinates(latitude, longitude);
      
    } catch (error) {
      console.error('Master 페이지 자동 위치 조회 실패:', error);
      // 자동 조회 실패 시에도 기본 기능은 계속 동작
    }
  }, []);

  useEffect(() => {
    autoGetCurrentLocation();
  }, [autoGetCurrentLocation]);

  // 검색어가 변경될 때마다 필터링 실행
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredInventory(inventory);
    } else {
      const filtered = inventory.filter(item => 
        item.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInventory(filtered);
    }
  }, [searchTerm, inventory]);

  
  const initializeMasterAccount = async () => {
    try {
      // 기존 마스터 계정이 있는지 확인
      const masterEmail = 'olyn@master.com';
      const userDoc = await getDoc(doc(db, 'users', 'master-account'));
      
      if (!userDoc.exists()) {
        // 마스터 계정이 없으면 생성 (비밀번호를 6자 이상으로 변경)
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            masterEmail,
            '096000'  // 6자 이상으로 변경
          );
          
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            id: 'olyn',
            role: 'master',
            createdAt: new Date().toISOString()
          });
          
          console.log('초기 마스터 계정이 생성되었습니다.');
        } catch (error) {
          if (error.code === 'auth/email-already-in-use') {
            console.log('마스터 계정이 이미 존재합니다.');
          } else {
            console.error('마스터 계정 생성 오류:', error);
          }
        }
      }
    } catch (error) {
      console.error('마스터 계정 초기화 오류:', error);
    }
  };
  

  const testDatabaseConnection = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/test');
      setDbStatus('success');
      setDbError(null);
    } catch (error) {
      setDbStatus('error');
      setDbError('데이터베이스 연결에 실패했습니다.');
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inventory');
      setInventory(response.data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  const handleCreateGuest = () => {
    navigate('/create-guest');
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setFormData({
      part_name: '',
      quantity: '',
      location: ''
    });
    setShowModal(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      part_name: item.part_name,
      quantity: item.quantity,
      location: item.location
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('정말로 이 항목을 삭제하시겠습니까?')) {
      try {
        await axios.delete(`http://localhost:5000/api/inventory/${id}`);
        fetchInventory();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // location과 address 합치기
    let mergedLocation = formData.location;
    if (formData.address && formData.address.trim() !== '') {
      mergedLocation = `${formData.location} - ${formData.address}`;
    }

    // 서버로 보낼 데이터 구성
    const inventoryData = {
      part_name: formData.part_name,
      quantity: formData.quantity,
      location: mergedLocation,
      created_at: new Date().toISOString()
    };

    try {
      if (editingItem) {
        // 수정
        const response = await axios.put(`http://localhost:5000/api/inventory/${editingItem.id}`, inventoryData);
        if (response.data.success) {
          alert('재고가 성공적으로 수정되었습니다.');
          setShowModal(false);
          setEditingItem(null);
          setFormData({
            part_name: '',
            quantity: '',
            location: ''
          });
          fetchInventory();
        }
      } else {
        // 추가
        const response = await axios.post('http://localhost:5000/api/inventory', inventoryData);
        if (response.data.success) {
          alert('재고가 성공적으로 추가되었습니다.');
          setShowModal(false);
          setFormData({
            part_name: '',
            quantity: '',
            location: ''
          });
          fetchInventory();
        }
      }
    } catch (error) {
      console.error('재고 처리 오류:', error);
      alert('재고 처리 중 오류가 발생했습니다.');
    }
  };

  const handleSearch = () => {
    // 검색은 이미 useEffect에서 자동으로 처리됨
    console.log('검색어:', searchTerm);
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    setIsLoadingAddress(true);
    try {
      console.log('주소 변환 시작:', { latitude, longitude });
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&accept-language=ko&addressdetails=1`
      );
      
      console.log('API 응답 상태:', response.status);
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('전체 주소 데이터:', data);
      console.log('display_name:', data.display_name);
      console.log('address 객체:', data.address);
      
      if (!data.display_name) {
        console.log('display_name이 없습니다.');
        setCurrentAddress('주소를 찾을 수 없습니다.');
        return;
      }
      
      let koreanAddress = '';
      
      // 방법 1: address 객체에서 직접 추출
      if (data.address) {
        const addr = data.address;
        console.log('address 객체 내용:', addr);
        
        // 한국 주소 구성 요소들
        const state = addr.state || addr.province; // 시/도
        const city = addr.city || addr.county; // 시/군
        const district = addr.district || addr.suburb; // 구
        const neighbourhood = addr.neighbourhood || addr.quarter; // 동
        
        console.log('추출된 주소 요소들:', { state, city, district, neighbourhood });
        
        const components = [];
        if (state) components.push(state);
        if (district) components.push(district);
        if (neighbourhood) components.push(neighbourhood);
        
        if (components.length > 0) {
          koreanAddress = components.join(' ');
        }
        
        console.log('방법 1 결과:', koreanAddress);
      }
      
      // 방법 2: display_name에서 파싱
      if (!koreanAddress || koreanAddress.trim() === '') {
        const addressParts = data.display_name.split(', ');
        console.log('주소 파트들:', addressParts);
        
        // 서울시 구 동 형태로 파싱
        let foundCity = false;
        let foundDistrict = false;
        let foundNeighbourhood = false;
        const components = [];
        
        for (let i = 0; i < addressParts.length; i++) {
          const part = addressParts[i].trim();
          console.log(`파트 ${i}:`, part);
          
          // 시/도 찾기
          if (!foundCity && (part.includes('서울') || part.includes('부산') || part.includes('대구') || 
              part.includes('인천') || part.includes('광주') || part.includes('대전') || 
              part.includes('울산') || part.includes('세종'))) {
            components.push(part);
            foundCity = true;
            console.log('시 찾음:', part);
          }
          
          // 구 찾기
          if (foundCity && !foundDistrict && (part.includes('구') || part.includes('군'))) {
            components.push(part);
            foundDistrict = true;
            console.log('구 찾음:', part);
          }
          
          // 동 찾기
          if (foundDistrict && !foundNeighbourhood && (part.includes('동') || part.includes('읍') || part.includes('면'))) {
            components.push(part);
            foundNeighbourhood = true;
            console.log('동 찾음:', part);
            break; // 동까지 찾았으면 종료
          }
        }
        
        if (components.length > 0) {
          koreanAddress = components.join(' ');
          console.log('방법 2 결과:', koreanAddress);
        }
      }
      
      // 방법 3: 전체 주소에서 시/구/동 추출
      if (!koreanAddress || koreanAddress.trim() === '') {
        const addressParts = data.display_name.split(', ');
        const components = [];
        
        for (let i = 0; i < addressParts.length; i++) {
          const part = addressParts[i].trim();
          
          // 시/도, 구, 동 중 하나라면 추가
          if (part.includes('서울') || part.includes('부산') || part.includes('대구') || 
              part.includes('인천') || part.includes('광주') || part.includes('대전') || 
              part.includes('울산') || part.includes('세종') || 
              part.includes('구') || part.includes('군') || 
              part.includes('동') || part.includes('읍') || part.includes('면')) {
            components.push(part);
          }
        }
        
        if (components.length > 0) {
          koreanAddress = components.join(' ');
          console.log('방법 3 결과:', koreanAddress);
        }
      }
      
      // 최종적으로 불필요한 요소 제거
      if (koreanAddress) {
        const parts = koreanAddress.split(' ');
        const filteredParts = parts.filter(part => 
          !part.includes('리') && !part.includes('가') && !part.includes('로') &&
          !part.includes('길') && !part.includes('번지') && !part.includes('대한민국')
        );
        koreanAddress = filteredParts.join(' ');
        console.log('최종 결과:', koreanAddress);
      }
      
      // 여전히 주소를 찾지 못한 경우 전체 주소 사용
      if (!koreanAddress || koreanAddress.trim() === '') {
        console.log('모든 방법으로 주소를 찾지 못했습니다. 전체 주소 사용:', data.display_name);
        koreanAddress = data.display_name.replace('대한민국', '').trim();
        if (koreanAddress.startsWith(',')) {
          koreanAddress = koreanAddress.substring(1).trim();
        }
      }
      
      setCurrentAddress(koreanAddress || '주소를 찾을 수 없습니다.');
    } catch (error) {
      console.error('주소 변환 오류:', error);
      console.error('오류 상세:', error.message);
      setCurrentAddress(`주소 변환 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const fetchBluehandsList = async () => {
    setIsLoadingBluehandsList(true);
    try {
      const response = await axios.get('http://localhost:5000/api/inventory/bluehands/list');
      let list = response.data.data;
      // 배열이 아니면 배열로 변환
      if (!Array.isArray(list)) {
        list = list ? [list] : [];
      }
      setBluehandsList(list);
      console.log('블루핸즈 지점 목록:', list);
    } catch (error) {
      console.error('블루핸즈 지점 목록 조회 오류:', error);
      setBluehandsList([]);
    } finally {
      setIsLoadingBluehandsList(false);
    }
  };

  // 거리 계산 함수 추가
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

  // clearLocation 함수가 사용된다면 아래와 같이 복구
  const clearLocation = () => {
    setCurrentLocation(null);
    setLocationError(null);
    setCurrentAddress(null);
  };

  return (
    <MasterContainer>
      <Header>
        <img src={process.env.PUBLIC_URL + '/image1-removebg-preview.png'} alt="현대자동차그룹 로고" style={{ height: '60px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <LoginStatus>master로 로그인 중입니다</LoginStatus>
          <TextLink onClick={handleCreateGuest}>게스트 계정 생성</TextLink>
          <TextLink onClick={handleLogout}>로그아웃</TextLink>
        </div>
      </Header>
      <Content>
        {dbStatus && (
          <DatabaseStatus status={dbStatus}>
            {dbStatus === 'success' ? '데이터베이스 연결 성공' : dbError}
          </DatabaseStatus>
        )}
        <LocationContainer>
          <LocationHeader>
            <LocationTitle>📍 현재 위치</LocationTitle>
            <div>
              {currentLocation && (
                <LocationButton onClick={clearLocation}>
                  초기화
                </LocationButton>
              )}
            </div>
          </LocationHeader>
          {isLoadingAddress && (
            <LocationLoading>주소를 확인하고 있습니다...</LocationLoading>
          )}
          {locationError && (
            <LocationError>{locationError}</LocationError>
          )}
          {currentLocation && !isLoadingAddress && (
            <LocationInfo>
              위도: {currentLocation.latitude.toFixed(6)}<br />
              경도: {currentLocation.longitude.toFixed(6)}
              {isLoadingAddress && (
                <div style={{ marginTop: '0.5rem', color: '#007bff' }}>
                  주소를 확인하고 있습니다...
                </div>
              )}
              {currentAddress && !isLoadingAddress && (
                <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  📍 {currentAddress}
                </div>
              )}
            </LocationInfo>
          )}
        </LocationContainer>
        <TableControls>
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="부품명을 입력하세요"
              value={searchTerm}
              onChange={handleSearchInputChange}
              onKeyPress={handleSearchKeyPress}
            />
            <SearchButton onClick={handleSearch}>검색</SearchButton>
          </SearchContainer>
          <AddButton onClick={handleAddClick}>+ 새 재고 추가</AddButton>
        </TableControls>
        {loading ? (
          <p>데이터를 불러오는 중...</p>
        ) : (
          <InventoryTable>
            <thead>
              <tr>
                <TableHeader>부품명</TableHeader>
                <TableHeader>수량</TableHeader>
                <TableHeader>지점</TableHeader>
                <TableHeader>등록일자</TableHeader>
                <TableHeader>작업</TableHeader>
              </tr>
            </thead>
            <tbody>
              {filteredInventory && filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <tr key={item.id}>
                    <TableCell>{item.part_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <ActionButton type="edit" onClick={() => handleEditClick(item)}>수정</ActionButton>
                      <ActionButton type="delete" onClick={() => handleDeleteClick(item.id)}>삭제</ActionButton>
                    </TableCell>
                  </tr>
                ))
              ) : (
                <tr>
                  <TableCell colSpan="5" style={{ textAlign: 'center' }}>
                    {searchTerm.trim() !== '' ? '검색 결과가 없습니다.' : '재고 데이터가 없습니다.'}
                  </TableCell>
                </tr>
              )}
            </tbody>
          </InventoryTable>
        )}
      </Content>

      {/* 내 근처 블루핸즈 매장 목록 */}
      <div style={{
        background: 'white',
        margin: '2rem auto',
        maxWidth: '1200px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        padding: '2rem',
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '1rem' }}>내 근처 블루핸즈 매장 목록</h2>
        {currentLocation && Array.isArray(bluehandsList) && bluehandsList.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>매장명</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>주소</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>전화번호</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>거리(km)</th>
                </tr>
              </thead>
              <tbody>
                {bluehandsList
                  .map(branch => ({
                    ...branch,
                    distance: (branch.latitude && branch.longitude && currentLocation) ?
                      getDistanceFromLatLonInKm(
                        currentLocation.latitude,
                        currentLocation.longitude,
                        Number(branch.latitude),
                        Number(branch.longitude)
                      ) : null
                  }))
                  .filter(branch => branch.distance !== null)
                  .sort((a, b) => a.distance - b.distance)
                  .slice(0, 5)
                  .map((branch, idx) => (
                    <tr key={branch.id || idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem' }}>{branch.name}</td>
                      <td style={{ padding: '0.5rem' }}>{branch.address}</td>
                      <td style={{ padding: '0.5rem' }}>{branch.phone_number}</td>
                      <td style={{ padding: '0.5rem' }}>{branch.distance.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: '#888', padding: '2rem', textAlign: 'center' }}>
            {currentLocation ? '근처에 블루핸즈 매장 데이터가 없습니다.' : '현재 위치 정보를 불러올 수 없습니다.'}
          </div>
        )}
      </div>

      {/* 블루핸즈 매장 목록 탭 */}
      <div style={{
        background: 'white',
        margin: '2rem auto',
        maxWidth: '1200px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        padding: '2rem',
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '1rem' }}>서울 내 블루 핸즈 매장 목록</h2>
        {isLoadingBluehandsList ? (
          <div style={{ color: '#007bff', padding: '1rem' }}>지점 목록을 불러오는 중...</div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>매장명</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>주소</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>전화번호</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>위도</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>경도</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>분류</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(bluehandsList) && bluehandsList.length > 0 ? (
                  bluehandsList.slice(0, bluehandsList.length).map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem' }}>{item.name}</td>
                      <td style={{ padding: '0.5rem' }}>{item.address}</td>
                      <td style={{ padding: '0.5rem' }}>{item.phone_number}</td>
                      <td style={{ padding: '0.5rem' }}>{item.latitude}</td>
                      <td style={{ padding: '0.5rem' }}>{item.longitude}</td>
                      <td style={{ padding: '0.5rem' }}>
                        {item.classification === 1 ? '전문블루핸즈' : item.classification === 2 ? '종합블루핸즈' : item.classification === 3 ? '하이테크센터' : '기타'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                      서울 내 블루 핸즈 매장 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal>
          <ModalContent>
            <h2>{editingItem ? '재고 수정' : '새 재고 추가'}</h2>
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>부품명</Label>
                <Input
                  type="text"
                  name="part_name"
                  value={formData.part_name}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>수량</Label>
                <Input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>지점 선택</Label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">지점을 선택하세요</option>
                  {Array.isArray(bluehandsList) && bluehandsList.map((branch) => (
                    <option key={branch.id} value={branch.name}>
                      {branch.name} - {branch.address}
                    </option>
                  ))}
                </select>
                {isLoadingBluehandsList && (
                  <div style={{ fontSize: '12px', color: '#007bff', marginTop: '0.25rem' }}>
                    지점 목록을 불러오는 중...
                  </div>
                )}
              </FormGroup>
              <ModalButtons>
                <Button type="button" onClick={() => setShowModal(false)}>취소</Button>
                <Button type="submit" primary>저장</Button>
              </ModalButtons>
            </form>
          </ModalContent>
        </Modal>
      )}
    </MasterContainer>
  );
}

export default Master; 