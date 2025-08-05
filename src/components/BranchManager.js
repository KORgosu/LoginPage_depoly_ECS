import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const BranchManagerContainer = styled.div`
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

const Title = styled.h1`
  color: #333;
  margin: 0;
`;

const Content = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  width: 300px;
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
  &:hover {
    background-color: #0056b3;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
`;

const StatisticsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: ${props => props.color || '#f8f9fa'};
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid ${props => props.borderColor || '#007bff'};
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.color || '#007bff'};
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
`;

const BranchTable = styled.table`
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

const PhoneLink = styled.a`
  color: #007bff;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const RegionBadge = styled.span`
  background-color: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
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

function BranchManager() {
  const [branches, setBranches] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    fetchBranches();
    fetchStatistics();
  }, []);

  const fetchBranches = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.region) params.append('region', filters.region);
      if (filters.city) params.append('city', filters.city);
      if (filters.district) params.append('district', filters.district);
      
      const response = await axios.get(`http://localhost:5000/api/branches?${params}`);
      setBranches(response.data.data);
      
      // 지역 목록 추출
      const uniqueRegions = [...new Set(response.data.data.map(branch => branch.region_name))];
      setRegions(uniqueRegions);
      
    } catch (error) {
      console.error('지점 조회 오류:', error);
      setError('지점 정보를 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/branches/statistics/regions');
      setStatistics(response.data);
    } catch (error) {
      console.error('통계 조회 오류:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchBranches();
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/branches/search/regions?q=${encodeURIComponent(searchTerm)}`);
      setBranches(response.data.data);
    } catch (error) {
      console.error('검색 오류:', error);
      setError('검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegionFilter = (region) => {
    setSelectedRegion(region);
    if (region) {
      fetchBranches({ region });
    } else {
      fetchBranches();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <BranchManagerContainer>
      <Header>
        <img src={process.env.PUBLIC_URL + '/image1-removebg-preview.png'} alt="현대자동차그룹 로고" style={{ height: '60px' }} />
        <Title>지점 관리</Title>
      </Header>
      
      <Content>
        <h2>지점 정보</h2>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {/* 통계 정보 */}
        {statistics && (
          <StatisticsContainer>
            <StatCard color="#e3f2fd" borderColor="#2196f3">
              <StatNumber color="#2196f3">{statistics.totalRegions}</StatNumber>
              <StatLabel>총 지역 수</StatLabel>
            </StatCard>
            <StatCard color="#f3e5f5" borderColor="#9c27b0">
              <StatNumber color="#9c27b0">{statistics.totalBranches}</StatNumber>
              <StatLabel>총 지점 수</StatLabel>
            </StatCard>
            <StatCard color="#e8f5e8" borderColor="#4caf50">
              <StatNumber color="#4caf50">{branches.length}</StatNumber>
              <StatLabel>현재 조회된 지점</StatLabel>
            </StatCard>
          </StatisticsContainer>
        )}
        
        {/* 검색 및 필터 */}
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="지점명, 지역명, 주소로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <SearchButton onClick={handleSearch}>검색</SearchButton>
        </SearchContainer>
        
        <FilterContainer>
          <span>지역 필터:</span>
          <FilterSelect
            value={selectedRegion}
            onChange={(e) => handleRegionFilter(e.target.value)}
          >
            <option value="">전체 지역</option>
            {regions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </FilterSelect>
        </FilterContainer>
        
        {loading ? (
          <LoadingSpinner>지점 정보를 불러오는 중...</LoadingSpinner>
        ) : (
          <>
            <BranchTable>
              <thead>
                <tr>
                  <TableHeader>지점 코드</TableHeader>
                  <TableHeader>지점명</TableHeader>
                  <TableHeader>지역</TableHeader>
                  <TableHeader>주소</TableHeader>
                  <TableHeader>전화번호</TableHeader>
                  <TableHeader>좌표</TableHeader>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.branch_code}>
                    <TableCell>{branch.branch_code}</TableCell>
                    <TableCell>
                      <strong>{branch.branch_name}</strong>
                    </TableCell>
                    <TableCell>
                      <RegionBadge>{branch.region_name}</RegionBadge>
                    </TableCell>
                    <TableCell>{branch.address}</TableCell>
                    <TableCell>
                      {branch.phone_number && (
                        <PhoneLink href={`tel:${branch.phone_number}`}>
                          {branch.phone_number}
                        </PhoneLink>
                      )}
                    </TableCell>
                    <TableCell>
                      {branch.latitude && branch.longitude ? (
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>
                          {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>좌표 없음</span>
                      )}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </BranchTable>
            
            {branches.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                조회된 지점이 없습니다.
              </div>
            )}
            
            {branches.length > 0 && (
              <div style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                총 {branches.length}개의 지점이 조회되었습니다.
              </div>
            )}
          </>
        )}
      </Content>
    </BranchManagerContainer>
  );
}

export default BranchManager; 