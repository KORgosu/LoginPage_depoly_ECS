@echo off
chcp 65001 >nul
echo ========================================
echo Fix ECS Cluster
echo ========================================
echo.

echo 1. Checking ECS cluster status...
aws ecs describe-clusters --clusters hyundai-login-cluster --region ap-northeast-2

echo.
echo 2. Creating ECS cluster if it doesn't exist...
aws ecs create-cluster --cluster-name hyundai-login-cluster --region ap-northeast-2

echo.
echo 3. Checking ECS cluster again...
aws ecs describe-clusters --clusters hyundai-login-cluster --region ap-northeast-2

echo.
echo 4. Checking ECS service...
aws ecs describe-services --cluster hyundai-login-cluster --services hyundai-login-service --region ap-northeast-2

echo.
echo ========================================
echo ECS cluster fixed!
echo ========================================
echo.
echo Next steps:
echo 1. Run fix-git-push.bat to trigger deployment again
echo 2. Check GitHub Actions: https://github.com/KORgosu/LoginPage_depoly_ECS/actions
echo.
pause 