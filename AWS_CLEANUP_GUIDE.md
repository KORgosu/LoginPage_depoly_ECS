# AWS 리소스 정리 가이드

## 🗑️ 비용 절약을 위한 AWS 리소스 정리

### ⚠️ 주의사항
- 이 작업은 **모든 AWS 리소스를 삭제**합니다
- 삭제 후에는 로그인 페이지에 접속할 수 없습니다
- 필요시 언제든지 다시 배포할 수 있습니다

## 📋 삭제되는 리소스 목록

### 1. ECS (Elastic Container Service)
- **ECS 서비스**: `hyundai-login-service`
- **ECS 클러스터**: `hyundai-login-cluster`
- **Task Definition**: `hyundai-login-task`

### 2. ECR (Elastic Container Registry)
- **리포지토리**: `hyundai-login-app`
- **Docker 이미지**: 모든 태그

### 3. ALB (Application Load Balancer)
- **로드 밸런서**: `hyundai-login-alb`
- **Target Group**: `hyundai-login-tg`
- **Listener**: HTTP 80 포트

### 4. 네트워킹
- **보안 그룹**: `sg-021845248fabfca17`
- **추가 서브넷**: `subnet-05f134646eb92fb37`

### 5. 모니터링
- **CloudWatch 로그 그룹**: `/ecs/hyundai-login-app`

### 6. IAM
- **역할**: `ecsTaskExecutionRole`

## 🚀 정리 방법

### 방법 1: 자동 정리 (권장)
```cmd
cleanup-all-aws-resources.bat
```

### 방법 2: 수동 정리
각 리소스를 개별적으로 삭제할 수 있습니다.

## ✅ 정리 확인

정리 후 남은 리소스 확인:
```cmd
check-remaining-resources.bat
```

## 💰 예상 비용 절약

### 삭제 전 월 비용
- **ECS Fargate**: ~$15-30/월
- **ALB**: ~$20/월
- **ECR**: ~$1-5/월
- **CloudWatch**: ~$1-3/월
- **총 예상 비용**: ~$37-58/월

### 삭제 후 비용
- **0원** (모든 리소스 삭제)

## 🔄 재배포 방법

필요시 언제든지 다시 배포할 수 있습니다:

1. **GitHub Secrets 설정** (Firebase 설정)
2. **코드 푸시**:
   ```bash
   git push origin main
   ```
3. **GitHub Actions 자동 배포**

## 📝 정리 체크리스트

- [ ] 정리 스크립트 실행
- [ ] 남은 리소스 확인
- [ ] AWS 콘솔에서 비용 확인
- [ ] 필요시 재배포 준비

## 🆘 문제 발생 시

정리 중 오류가 발생하면:
1. `check-remaining-resources.bat` 실행
2. 남은 리소스 확인
3. AWS 콘솔에서 수동 삭제 