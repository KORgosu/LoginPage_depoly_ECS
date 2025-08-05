import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const CreateGuestContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 2rem;
`;

const CreateGuestForm = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin: 0.5rem 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.8rem;
  margin-top: 1rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background-color: #218838;
  }
`;

const BackButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 1rem;
  
  &:hover {
    background-color: #5a6268;
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  justify-content: center;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
`;

const RadioInput = styled.input`
  cursor: pointer;
`;

const CreateGuest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: '',
    password: ''
  });
  const [accountType, setAccountType] = useState('guest');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id || !formData.password) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    // 비밀번호 길이 검증 (Firebase는 최소 6자 요구)
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      // 입력된 ID에서 공백 제거
      const cleanId = formData.id.trim();
      
      // 계정 타입에 따라 이메일 도메인 결정
      const emailDomain = accountType === 'master' ? '@master.com' : '@guest.com';
      const email = `${cleanId}${emailDomain}`;
      
      // Firebase Authentication으로 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        formData.password
      );

      // Firestore에 추가 정보 저장
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        id: cleanId,
        role: accountType,
        createdAt: new Date().toISOString()
      });

      alert(`${accountType === 'master' ? 'Master' : 'Guest'} 계정이 성공적으로 생성되었습니다.`);
      navigate('/master');
    } catch (error) {
      console.error('Error creating account:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('이미 존재하는 사용자 ID입니다.');
      } else if (error.code === 'auth/weak-password') {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreateGuestContainer>
      <BackButton onClick={() => navigate('/master')}>뒤로 가기</BackButton>
      <CreateGuestForm onSubmit={handleSubmit}>
        <h2>계정 생성</h2>
        
        <RadioGroup>
          <RadioLabel>
            <RadioInput
              type="radio"
              name="accountType"
              value="guest"
              checked={accountType === 'guest'}
              onChange={(e) => setAccountType(e.target.value)}
            />
            Guest 계정
          </RadioLabel>
          <RadioLabel>
            <RadioInput
              type="radio"
              name="accountType"
              value="master"
              checked={accountType === 'master'}
              onChange={(e) => setAccountType(e.target.value)}
            />
            Master 계정
          </RadioLabel>
        </RadioGroup>
        
        <Input
          type="text"
          name="id"
          placeholder="사용자 ID"
          value={formData.id}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit" disabled={loading}>
          {loading ? '계정 생성 중...' : '계정 생성'}
        </Button>
      </CreateGuestForm>
    </CreateGuestContainer>
  );
};

export default CreateGuest; 