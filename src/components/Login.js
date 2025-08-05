import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const LoginContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
  position: relative;
`;

const LeftSection = styled.div`
  flex: 6.5;
  background: url('/hyundai-background.jpg') center/cover no-repeat;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3));
  }
`;

const RightSection = styled.div`
  flex: 3.5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  background-color: #f5f5f5;
`;

const BottomRectangle = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 10vh;
  background-color: #1C1B1B;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 3rem;
  padding-bottom: 0;
  z-index: 100;
`;

const WhiteLogo = styled.img`
  height: 24px;
  width: auto;
  object-fit: contain;
  filter: brightness(0) invert(1);
`;

const AutoeverLogo = styled.img`
  height: 24px;
  width: auto;
  object-fit: contain;
  margin-right: 1.2rem;
  filter: brightness(0) invert(1);
`;

const KeficoLogo = styled.img`
  height: 60px;
  width: auto;
  object-fit: contain;
  margin-right: 1.2rem;
  filter: brightness(0) invert(1);
`;

const BluehandsLogo = styled.img`
  height: 32px;
  width: auto;
  object-fit: contain;
  cursor: pointer;
  filter: brightness(0) invert(1);
`;

const LoginBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Logo = styled.img`
  width: 120px;
  margin-top: 2rem;
  object-fit: contain;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #002C5F;
  }
`;

const Button = styled.button`
  padding: 0.8rem;
  background-color: #002C5F;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: #001F4D;
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  margin-top: 1rem;
  white-space: pre-line;
`;

const TopCenterImage = styled.img`
  display: block;
  margin: 2rem auto 1.5rem auto;
  max-width: 300px;
  width: 78%;
  height: auto;
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 입력된 값에서 공백 제거
      const cleanEmail = email.trim();
      
      // 입력된 값이 이메일 형식인지 확인
      const isEmail = cleanEmail.includes('@');
      let loginEmail = cleanEmail;
      
      // 이메일 형식이 아니라면 @guest.com을 붙여서 이메일 형식으로 변환
      if (!isEmail) {
        loginEmail = `${cleanEmail}@guest.com`;
      }
      
      await signInWithEmailAndPassword(auth, loginEmail, password);
      
      // 로그인 성공 후 사용자 역할 확인
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'guest') {
            navigate('/guest');
          } else {
            navigate('/master');
          }
        } else {
          // Firestore에 사용자 정보가 없으면 마스터로 간주
          navigate('/master');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('존재하지 않는 사용자입니다. ID 또는 이메일을 확인해주세요.');
      } else if (error.code === 'auth/wrong-password') {
        setError('비밀번호가 올바르지 않습니다.');
      } else {
        setError('로그인에 실패했습니다.\nID/이메일과 비밀번호를 확인해주세요.');
      }
    }
  };

  return (
    <LoginContainer>
      <LeftSection />
      <RightSection>
        <LoginBox>
          <TopCenterImage src="/image1-removebg-preview.png" alt="현대자동차그룹 통합 재고관리 데이터베이스" />
          <Form onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="사용자 ID 또는 이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit">로그인</Button>
          </Form>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Logo src="/hyundai-logo.png" alt="현대자동차 로고" />
        </LoginBox>
      </RightSection>
      <BottomRectangle>
        <WhiteLogo src="/logo_footer.png" alt="현대자동차 화이트 로고" />
        <a
          href="https://www.hyundai-autoever.com/kor/main/index.do"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', paddingRight: '1rem' }}
        >
          <AutoeverLogo src="/logo-autoever-pc.png" alt="오토에버 로고" />
        </a>
        <a
          href="https://www.hyundai-kefico.com/ko/main/index.do"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', paddingRight: '1rem' }}
        >
          <KeficoLogo src="/logo-kefico.png" alt="케피코 로고" />
        </a>
        <a
          href="https://www.hyundai.com/kr/ko/service-membership/service-network/service-network-information/bluehands"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', paddingRight: '3rem' }}
        >
          <BluehandsLogo src="/logo-bluehands-pc.png" alt="블루핸즈 로고" />
        </a>
      </BottomRectangle>
    </LoginContainer>
  );
};

export default Login; 