@echo off
chcp 65001 >nul
echo ========================================
echo Fix ECR Repository
echo ========================================
echo.

echo 1. Creating ECR repository...
aws ecr create-repository --repository-name hyundai-login-app --region ap-northeast-2

echo.
echo 2. Getting ECR login token...
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 716773066105.dkr.ecr.ap-northeast-2.amazonaws.com

echo.
echo 3. Checking ECR repository...
aws ecr describe-repositories --repository-names hyundai-login-app --region ap-northeast-2

echo.
echo ========================================
echo ECR repository fixed!
echo ========================================
echo.
echo Next steps:
echo 1. Run fix-git-push.bat to trigger deployment again
echo 2. Check GitHub Actions: https://github.com/KORgosu/LoginPage_depoly_ECS/actions
echo.
pause 