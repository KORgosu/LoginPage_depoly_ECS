# GitHub Actions + Amazon ECS 배포 가이드

## 📋 전체 배포 흐름

1. **GitHub Actions** → Docker 이미지 빌드 → ECR 푸시
2. **Amazon ECS** → 컨테이너 실행 → ALB 연결
3. **외부 접속** → 로그인 페이지 접근

## 🚀 단계별 배포 과정

### 1단계: 로그인 페이지 전용 설정

```cmd
deploy-login-only.bat
```

이 스크립트는 다음을 수행합니다:
- 로그인 페이지만 포함하는 App.js 생성
- 최적화된 package.json 생성
- Dockerfile 생성
- nginx.conf 생성

### 2단계: AWS 인프라 설정

```cmd
setup-aws-infrastructure.bat
```

이 스크립트는 다음을 생성합니다:
- ECR 리포지토리 (Docker 이미지 저장소)
- ECS 클러스터 (컨테이너 실행 환경)
- IAM 역할 (권한 설정)
- VPC 및 보안 그룹 (네트워크 설정)
- Application Load Balancer (외부 접속용)
- ECS 서비스 (애플리케이션 실행)

### 3단계: GitHub Secrets 설정

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 시크릿을 설정:

- `AWS_ACCESS_KEY_ID`: AWS 액세스 키 ID
- `AWS_SECRET_ACCESS_KEY`: AWS 시크릿 액세스 키

### 4단계: 코드 푸시 및 자동 배포

```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

GitHub Actions가 자동으로 실행되어:
1. Docker 이미지 빌드
2. ECR에 이미지 푸시
3. ECS 서비스 업데이트

## 🔧 필요한 AWS 권한

배포를 위해 다음 AWS 서비스에 대한 권한이 필요합니다:

### ECR 권한
- `ecr:CreateRepository`
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`
- `ecr:InitiateLayerUpload`
- `ecr:UploadLayerPart`
- `ecr:CompleteLayerUpload`
- `ecr:PutImage`

### ECS 권한
- `ecs:CreateCluster`
- `ecs:CreateService`
- `ecs:RegisterTaskDefinition`
- `ecs:UpdateService`
- `ecs:DescribeServices`

### IAM 권한
- `iam:CreateRole`
- `iam:AttachRolePolicy`
- `iam:GetRole`

### EC2 권한
- `ec2:CreateSecurityGroup`
- `ec2:AuthorizeSecurityGroupIngress`
- `ec2:DescribeVpcs`
- `ec2:DescribeSubnets`

### ELB 권한
- `elasticloadbalancing:CreateLoadBalancer`
- `elasticloadbalancing:CreateTargetGroup`
- `elasticloadbalancing:CreateListener`
- `elasticloadbalancing:DescribeLoadBalancers`

## 📁 생성되는 파일들

### GitHub Actions
- `.github/workflows/deploy-to-ecs.yml`: 자동 배포 워크플로우

### AWS 설정
- `ecs-task-definition.json`: ECS 태스크 정의
- `setup-aws-infrastructure.bat`: AWS 인프라 설정 스크립트

### 애플리케이션
- `src/App.js`: 로그인 전용 앱
- `package.json`: 최적화된 의존성
- `Dockerfile`: Docker 이미지 빌드
- `nginx.conf`: 웹 서버 설정

## 🔍 배포 확인

### GitHub Actions 확인
1. GitHub 저장소의 Actions 탭 방문
2. 워크플로우 실행 상태 확인
3. 빌드 및 배포 로그 확인

### AWS 콘솔 확인
1. **ECR**: 이미지가 업로드되었는지 확인
2. **ECS**: 서비스가 실행 중인지 확인
3. **ALB**: 로드밸런서 상태 확인

### 외부 접속 확인
```bash
# ALB DNS 이름으로 접속
curl http://[ALB-DNS-NAME]
```

## 🛠️ 문제 해결

### GitHub Actions 실패 시
1. GitHub Secrets 설정 확인
2. AWS 권한 확인
3. 워크플로우 로그 확인

### ECS 배포 실패 시
1. ECR 이미지 확인
2. Task Definition 확인
3. 서비스 로그 확인

### 외부 접속 불가 시
1. 보안 그룹 설정 확인
2. ALB 상태 확인
3. Target Group 상태 확인

## 💰 예상 비용

- **ECR**: 약 $1-5/월
- **ECS Fargate**: 약 $15-30/월 (1개 인스턴스)
- **ALB**: 약 $20/월
- **CloudWatch**: 약 $5-10/월

**총 예상 비용**: 약 $40-65/월

## 🔄 자동 배포

main 또는 master 브랜치에 push할 때마다 자동으로 배포됩니다:

```bash
# 코드 변경 후
git add .
git commit -m "Update login page"
git push origin main
```

GitHub Actions가 자동으로 실행되어 새로운 버전을 배포합니다.

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. GitHub Actions 로그
2. AWS CloudWatch 로그
3. ECS 서비스 이벤트
4. ALB Target Group 상태 