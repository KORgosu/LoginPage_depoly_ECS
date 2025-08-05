@echo off
REM 실패한 태스크 상세 정보 확인 스크립트 (Windows CMD)
REM 사용법: check-failed-tasks.bat

echo ========================================
echo 실패한 태스크 상세 정보 확인
echo ========================================
echo.

echo 1. 최근 실패한 태스크 목록...
aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --desired-status STOPPED --region ap-northeast-2

echo.
echo 2. 최근 실패한 태스크 상세 정보...
for /f "tokens=*" %%i in ('aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --desired-status STOPPED --region ap-northeast-2 --query "taskArns[0]" --output text') do set FAILED_TASK_ARN=%%i
if not "%FAILED_TASK_ARN%"=="None" (
    aws ecs describe-tasks --cluster hyundai-login-cluster --tasks %FAILED_TASK_ARN% --region ap-northeast-2
) else (
    echo No failed tasks found
)

echo.
echo 3. CloudWatch 로그 확인...
for /f "tokens=*" %%i in ('aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --desired-status STOPPED --region ap-northeast-2 --query "taskArns[0]" --output text') do set FAILED_TASK_ARN=%%i
if not "%FAILED_TASK_ARN%"=="None" (
    for /f "tokens=*" %%j in ('aws ecs describe-tasks --cluster hyundai-login-cluster --tasks %FAILED_TASK_ARN% --region ap-northeast-2 --query "tasks[0].containers[0].logStreamPrefix" --output text') do set LOG_STREAM=%%j
    echo Log stream: %LOG_STREAM%
    aws logs describe-log-streams --log-group-name "/ecs/hyundai-login-app" --log-stream-name-prefix "%LOG_STREAM%" --region ap-northeast-2
) else (
    echo No failed tasks found
)

echo.
echo ========================================
echo 확인 완료
echo ========================================
pause 