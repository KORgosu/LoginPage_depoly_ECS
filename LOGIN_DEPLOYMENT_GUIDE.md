# 로그???�이지 ?�용 배포 가?�드

## 로컬 ?�스??
```bash
npm install
npm start
```

## Docker�?빌드
```bash
docker build -t hyundai-login-app .
docker run -p 3000:80 hyundai-login-app
```

## ?�적 ?�스??(?? GitHub Pages, Netlify, Vercel)
1. `npm run build` ?�행
2. `build` ?�더???�용???�스???�비?�에 ?�로??

## Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## AWS S3 + CloudFront
1. S3 버킷 ?�성
2. ?�적 ?�사?�트 ?�스???�성??

## ?�경 변???�정
Firebase ?�정???�요??경우:
- REACT_APP_FIREBASE_API_KEY
- REACT_APP_FIREBASE_AUTH_DOMAIN
- REACT_APP_FIREBASE_PROJECT_ID
- REACT_APP_FIREBASE_STORAGE_BUCKET
- REACT_APP_FIREBASE_MESSAGING_SENDER_ID
- REACT_APP_FIREBASE_APP_ID
