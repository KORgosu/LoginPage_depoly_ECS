@echo off
REM ECS 서비스 강제 업데이트 스크립트 (Windows CMD)
REM 사용법: force-update-service.bat

echo Force updating ECS service...
echo.

echo Updating service with current task definition...
aws ecs update-service --cluster hyundai-login-cluster --service hyundai-login-service --force-new-deployment --region ap-northeast-2

echo.
echo Waiting for service to be stable...
timeout /t 60 /nobreak >nul

echo.
echo Checking service status...
aws ecs describe-services --cluster hyundai-login-cluster --services hyundai-login-service --region ap-northeast-2

echo.
echo Force update completed!
pause 