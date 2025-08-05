@echo off
REM 컨테이너 로그 확인 스크립트 (Windows CMD)
REM 사용법: check-container-logs.bat

echo ========================================
echo 컨테이너 로그 확인
echo ========================================
echo.

echo 1. 실행 중인 태스크 확인...
aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --desired-status RUNNING --region ap-northeast-2

echo.
echo 2. 최근 태스크 로그 확인...
for /f "tokens=*" %%i in ('aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --desired-status RUNNING --region ap-northeast-2 --query "taskArns[0]" --output text') do set TASK_ARN=%%i
if not "%TASK_ARN%"=="None" (
    echo Task ARN: %TASK_ARN%
    aws ecs describe-tasks --cluster hyundai-login-cluster --tasks %TASK_ARN% --region ap-northeast-2
) else (
    echo No running tasks found
)

echo.
echo 3. CloudWatch 로그 확인...
for /f "tokens=*" %%i in ('aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --desired-status RUNNING --region ap-northeast-2 --query "taskArns[0]" --output text') do set TASK_ARN=%%i
if not "%TASK_ARN%"=="None" (
    for /f "tokens=*" %%j in ('aws ecs describe-tasks --cluster hyundai-login-cluster --tasks %TASK_ARN% --region ap-northeast-2 --query "tasks[0].containers[0].logStreamPrefix" --output text') do set LOG_STREAM=%%j
    echo Log stream: %LOG_STREAM%
    aws logs get-log-events --log-group-name "/ecs/hyundai-login-app" --log-stream-name "%LOG_STREAM%" --region ap-northeast-2
) else (
    echo No running tasks found
)

echo.
echo 4. ALB 타겟 상태 확인...
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-2:716773066105:targetgroup/hyundai-login-tg/898916fb71ca683f --region ap-northeast-2

echo.
echo ========================================
echo 확인 완료
echo ========================================
pause 