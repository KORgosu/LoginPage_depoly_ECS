@echo off
REM ECS 서비스 상태 확인 스크립트 (Windows CMD)
REM 사용법: check-ecs-status.bat

echo Checking ECS service status...
echo.

aws ecs describe-services --cluster hyundai-login-cluster --services hyundai-login-service --region ap-northeast-2

echo.
echo Checking ECS tasks...
echo.

aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --region ap-northeast-2

echo.
echo Checking ECR repository...
echo.

aws ecr describe-repositories --repository-names hyundai-login-app --region ap-northeast-2

echo.
pause 