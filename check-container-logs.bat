@echo off
REM 컨테이너 로그 확인 스크립트 (Windows CMD)
REM 사용법: check-container-logs.bat

chcp 65001 >nul
echo ========================================
echo Container Log Check
echo ========================================
echo.

echo 1. Checking running tasks...
aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --desired-status RUNNING --region ap-northeast-2

echo.
echo 2. Checking recent task logs...
for /f "tokens=*" %%i in ('aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --desired-status RUNNING --region ap-northeast-2 --query "taskArns[0]" --output text') do set TASK_ARN=%%i
if not "%TASK_ARN%"=="None" (
    echo Task ARN: %TASK_ARN%
    aws ecs describe-tasks --cluster hyundai-login-cluster --tasks %TASK_ARN% --region ap-northeast-2
) else (
    echo No running tasks found
)

echo.
echo 3. Checking CloudWatch logs...
for /f "tokens=*" %%i in ('aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --desired-status RUNNING --region ap-northeast-2 --query "taskArns[0]" --output text') do set TASK_ARN=%%i
if not "%TASK_ARN%"=="None" (
    for /f "tokens=*" %%j in ('aws ecs describe-tasks --cluster hyundai-login-cluster --tasks %TASK_ARN% --region ap-northeast-2 --query "tasks[0].containers[0].logStreamPrefix" --output text') do set LOG_STREAM=%%j
    echo Log stream: %LOG_STREAM%
    aws logs get-log-events --log-group-name "/ecs/hyundai-login-app" --log-stream-name "%LOG_STREAM%" --region ap-northeast-2
) else (
    echo No running tasks found
)

echo.
echo 4. Checking ALB target status...
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-2:716773066105:targetgroup/hyundai-login-tg/898916fb71ca683f --region ap-northeast-2

echo.
echo ========================================
echo Check completed
echo ========================================
pause 