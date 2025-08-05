# GitHub Secrets 설정 가이드

## 🔐 Firebase 설정을 GitHub Secrets에 등록

### 1단계: GitHub 저장소 설정
1. GitHub 저장소 페이지로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Secrets and variables** → **Actions** 클릭
4. **New repository secret** 버튼 클릭

### 2단계: Firebase Secrets 등록

다음 6개의 Secret을 각각 등록하세요:

#### 1. REACT_APP_FIREBASE_API_KEY
- **Name**: `REACT_APP_FIREBASE_API_KEY`
- **Value**: Firebase 콘솔의 `apiKey` 값 (예: `AIzaSyC...`)

#### 2. REACT_APP_FIREBASE_AUTH_DOMAIN
- **Name**: `REACT_APP_FIREBASE_AUTH_DOMAIN`
- **Value**: Firebase 콘솔의 `authDomain` 값 (예: `project.firebaseapp.com`)

#### 3. REACT_APP_FIREBASE_PROJECT_ID
- **Name**: `REACT_APP_FIREBASE_PROJECT_ID`
- **Value**: Firebase 콘솔의 `projectId` 값 (예: `my-project-123`)

#### 4. REACT_APP_FIREBASE_STORAGE_BUCKET
- **Name**: `REACT_APP_FIREBASE_STORAGE_BUCKET`
- **Value**: Firebase 콘솔의 `storageBucket` 값 (예: `my-project-123.appspot.com`)

#### 5. REACT_APP_FIREBASE_MESSAGING_SENDER_ID
- **Name**: `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- **Value**: Firebase 콘솔의 `messagingSenderId` 값 (예: `123456789`)

#### 6. REACT_APP_FIREBASE_APP_ID
- **Name**: `REACT_APP_FIREBASE_APP_ID`
- **Value**: Firebase 콘솔의 `appId` 값 (예: `1:123456789:web:abc123`)

### 3단계: AWS Secrets 등록 (이미 설정되어 있다면 생략)

#### AWS_ACCESS_KEY_ID
- **Name**: `AWS_ACCESS_KEY_ID`
- **Value**: AWS Access Key ID

#### AWS_SECRET_ACCESS_KEY
- **Name**: `AWS_SECRET_ACCESS_KEY`
- **Value**: AWS Secret Access Key

## 🔍 Firebase 설정값 확인 방법

1. [Firebase 콘솔](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. 왼쪽 상단 톱니바퀴 아이콘 → **프로젝트 설정**
4. **일반** 탭 → **웹 앱** 섹션
5. **Firebase SDK 스니펫** → **구성** 선택

## 🚀 배포 방법

Secrets 설정 완료 후:

1. 코드 커밋 및 푸시:
   ```bash
   git add .
   git commit -m "Add Firebase secrets support"
   git push origin main
   ```

2. GitHub Actions에서 자동 배포 확인

3. 배포 완료 후 로그인 페이지 접속:
   ```
   http://hyundai-login-alb-297074594.ap-northeast-2.elb.amazonaws.com
   ```

## ✅ 확인 사항

- [ ] Firebase 콘솔에서 설정값 확인
- [ ] GitHub Secrets 6개 등록
- [ ] AWS Secrets 2개 등록 (이미 설정됨)
- [ ] 코드 푸시하여 배포 트리거
- [ ] 로그인 페이지 정상 작동 확인 