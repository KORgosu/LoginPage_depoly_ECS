@echo off
REM 로그인 페이지 전용 배포 스크립트 (Windows CMD)
REM 사용법: deploy-login-only.bat

echo Deploying Login Page Only...
echo.

REM 1. 로그인 페이지 전용 App.js 생성
echo Creating login-only App.js...
(
echo import React from 'react';
echo import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
echo import Login from './components/Login';
echo.
echo function App^(^) {
echo   return ^(
echo     ^<Router^>
echo       ^<Routes^>
echo         ^<Route path="/" element={^<Login /^>} /^>
echo         ^<Route path="*" element={^<Login /^>} /^>
echo       ^</Routes^>
echo     ^</Router^>
echo   ^);
echo }
echo.
echo export default App;
) > src\App.js
echo Login-only App.js created successfully

REM 2. 로그인 페이지 전용 package.json 생성
echo Creating login-only package.json...
(
echo {
echo   "name": "hyundai-login-app",
echo   "version": "1.0.0",
echo   "description": "Hyundai Login Page",
echo   "main": "index.js",
echo   "scripts": {
echo     "start": "react-scripts start",
echo     "build": "react-scripts build",
echo     "test": "react-scripts test",
echo     "eject": "react-scripts eject"
echo   },
echo   "dependencies": {
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "react-router-dom": "^6.8.0",
echo     "react-scripts": "5.0.1",
echo     "styled-components": "^5.3.6",
echo     "firebase": "^9.17.0"
echo   },
echo   "browserslist": {
echo     "production": [
echo       "^>0.2%%",
echo       "not dead",
echo       "not op_mini all"
echo     ],
echo     "development": [
echo       "last 1 chrome version",
echo       "last 1 firefox version",
echo       "last 1 safari version"
echo     ]
echo   }
echo }
) > package.json
echo Login-only package.json created successfully

REM 3. 로그인 페이지 전용 Dockerfile 생성
echo Creating login-only Dockerfile...
(
echo # Build stage
echo FROM node:18-alpine AS build
echo.
echo WORKDIR /app
echo.
echo # Copy package files
echo COPY package*.json ./
echo.
echo # Install dependencies
echo RUN npm ci --only=production
echo.
echo # Copy source code
echo COPY src ./src
echo COPY public ./public
echo.
echo # Build React app
echo RUN npm run build
echo.
echo # Production stage
echo FROM nginx:alpine
echo.
echo # Copy built app to nginx
echo COPY --from=build /app/build /usr/share/nginx/html
echo.
echo # Copy nginx configuration
echo COPY nginx.conf /etc/nginx/nginx.conf
echo.
echo # Expose port
echo EXPOSE 80
echo.
echo # Start nginx
echo CMD ["nginx", "-g", "daemon off;"]
) > Dockerfile
echo Login-only Dockerfile created successfully

REM 4. nginx.conf 생성
echo Creating nginx.conf...
(
echo events {
echo     worker_connections 1024;
echo }
echo.
echo http {
echo     include       /etc/nginx/mime.types;
echo     default_type  application/octet-stream;
echo.
echo     server {
echo         listen 80;
echo         server_name localhost;
echo         root /usr/share/nginx/html;
echo         index index.html;
echo.
echo         location / {
echo             try_files $uri $uri/ /index.html;
echo         }
echo.
echo         # Cache static assets
echo         location ~* \.^(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^)$ {
echo             expires 1y;
echo             add_header Cache-Control "public, immutable";
echo         }
echo     }
echo }
) > nginx.conf
echo nginx.conf created successfully

REM 5. 로그인 페이지 전용 .dockerignore 생성
echo Creating login-only .dockerignore...
(
echo node_modules
echo npm-debug.log
echo build
echo .git
echo .gitignore
echo README.md
echo server
echo src/components/Master.js
echo src/components/Guest.js
echo src/components/CreateGuest.js
echo src/components/BranchManager.js
) > .dockerignore
echo Login-only .dockerignore created successfully

REM 6. 배포 가이드 생성
echo Creating deployment guide...
(
echo # 로그인 페이지 전용 배포 가이드
echo.
echo ## 로컬 테스트
echo ```bash
echo npm install
echo npm start
echo ```
echo.
echo ## Docker로 빌드
echo ```bash
echo docker build -t hyundai-login-app .
echo docker run -p 3000:80 hyundai-login-app
echo ```
echo.
echo ## 정적 호스팅 ^(예: GitHub Pages, Netlify, Vercel^)
echo 1. `npm run build` 실행
echo 2. `build` 폴더의 내용을 호스팅 서비스에 업로드
echo.
echo ## Firebase Hosting
echo ```bash
echo npm install -g firebase-tools
echo firebase login
echo firebase init hosting
echo firebase deploy
echo ```
echo.
echo ## AWS S3 + CloudFront
echo 1. S3 버킷 생성
echo 2. 정적 웹사이트 호스팅 활성화
echo 3. build 폴더 내용 업로드
echo 4. CloudFront 배포 ^(선택사항^)
echo.
echo ## 환경 변수 설정
echo Firebase 설정이 필요한 경우:
echo - REACT_APP_FIREBASE_API_KEY
echo - REACT_APP_FIREBASE_AUTH_DOMAIN
echo - REACT_APP_FIREBASE_PROJECT_ID
echo - REACT_APP_FIREBASE_STORAGE_BUCKET
echo - REACT_APP_FIREBASE_MESSAGING_SENDER_ID
echo - REACT_APP_FIREBASE_APP_ID
) > LOGIN_DEPLOYMENT_GUIDE.md
echo Deployment guide created successfully

echo.
echo Login page deployment setup completed!
echo.
echo Next steps:
echo 1. Test locally: npm install ^&^& npm start
echo 2. Build for production: npm run build
echo 3. Deploy using your preferred method
echo.
echo See LOGIN_DEPLOYMENT_GUIDE.md for detailed instructions.
pause 