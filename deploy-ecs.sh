#!/bin/bash

# AWS ECS 배포 스크립트
# 사용법: ./deploy-ecs.sh [CLUSTER_NAME] [SERVICE_NAME]

set -e

# 기본값 설정
CLUSTER_NAME=${1:-"hyundai-inventory-cluster"}
SERVICE_NAME=${2:-"hyundai-inventory-service"}
REGION=${AWS_REGION:-"ap-northeast-2"}

echo "🚀 ECS 배포 시작..."
echo "클러스터: $CLUSTER_NAME"
echo "서비스: $SERVICE_NAME"
echo "리전: $REGION"

# 1. ECR 로그인
echo "📦 ECR 로그인 중..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com

# 2. ECR 리포지토리 URI 가져오기
ECR_REPO=$(aws ecr describe-repositories --repository-names hyundai-inventory-app --region $REGION --query 'repositories[0].repositoryUri' --output text)
echo "ECR 리포지토리: $ECR_REPO"

# 3. Docker 이미지 빌드 및 푸시
echo "🔨 Docker 이미지 빌드 중..."
IMAGE_TAG=$(date +%Y%m%d-%H%M%S)
docker build \
  --build-arg REACT_APP_FIREBASE_API_KEY=$REACT_APP_FIREBASE_API_KEY \
  --build-arg REACT_APP_FIREBASE_AUTH_DOMAIN=$REACT_APP_FIREBASE_AUTH_DOMAIN \
  --build-arg REACT_APP_FIREBASE_PROJECT_ID=$REACT_APP_FIREBASE_PROJECT_ID \
  --build-arg REACT_APP_FIREBASE_STORAGE_BUCKET=$REACT_APP_FIREBASE_STORAGE_BUCKET \
  --build-arg REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$REACT_APP_FIREBASE_MESSAGING_SENDER_ID \
  --build-arg REACT_APP_FIREBASE_APP_ID=$REACT_APP_FIREBASE_APP_ID \
  -t $ECR_REPO:$IMAGE_TAG .

echo "📤 Docker 이미지 푸시 중..."
docker push $ECR_REPO:$IMAGE_TAG

# 4. Task Definition 업데이트
echo "📋 Task Definition 업데이트 중..."
TASK_DEF_ARN=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION --query 'services[0].taskDefinition' --output text)

# Task Definition JSON 가져오기
aws ecs describe-task-definition --task-definition $TASK_DEF_ARN --region $REGION > temp-task-def.json

# 이미지 URI 업데이트
jq --arg IMAGE "$ECR_REPO:$IMAGE_TAG" '.taskDefinition.containerDefinitions[0].image = $IMAGE' temp-task-def.json > updated-task-def.json

# 새로운 Task Definition 등록
NEW_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json file://updated-task-def.json --region $REGION --query 'taskDefinition.taskDefinitionArn' --output text)

echo "새로운 Task Definition: $NEW_TASK_DEF_ARN"

# 5. 서비스 업데이트
echo "🔄 서비스 업데이트 중..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition $NEW_TASK_DEF_ARN \
  --region $REGION

# 6. 배포 완료 대기
echo "⏳ 배포 완료 대기 중..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION

echo "✅ 배포 완료!"
echo "새로운 이미지: $ECR_REPO:$IMAGE_TAG"

# 7. 정리
rm -f temp-task-def.json updated-task-def.json

# 8. 서비스 상태 확인
echo "📊 서비스 상태 확인..."
aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION \
  --query 'services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount,Events:events[0:3]}' \
  --output table 