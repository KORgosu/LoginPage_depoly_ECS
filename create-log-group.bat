@echo off
REM CloudWatch 로그 그룹 생성 스크립트 (Windows CMD)
REM 사용법: create-log-group.bat

echo Creating CloudWatch log group...
echo.

echo Creating log group: /ecs/hyundai-login-app
aws logs create-log-group --log-group-name "/ecs/hyundai-login-app" --region ap-northeast-2

if errorlevel 1 (
    echo Log group already exists or creation failed
) else (
    echo Log group created successfully
)

echo.
echo Setting log retention policy (7 days)...
aws logs put-retention-policy --log-group-name "/ecs/hyundai-login-app" --retention-in-days 7 --region ap-northeast-2

echo.
echo Log group setup completed!
pause 