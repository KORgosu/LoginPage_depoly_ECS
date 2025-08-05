@echo off
chcp 65001 >nul
echo ========================================
echo Debug ALB Timeout Issue
echo ========================================
echo.

echo 1. Checking ECS service status...
aws ecs describe-services --cluster hyundai-login-cluster --services hyundai-login-service --region ap-northeast-2 --query "services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount,PendingCount:pendingCount}"

echo.
echo 2. Checking ECS tasks...
aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --region ap-northeast-2

echo.
echo 3. Checking task details...
for /f "tokens=*" %%i in ('aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --region ap-northeast-2 --query "taskArns[0]" --output text') do set TASK_ARN=%%i
if not "%TASK_ARN%"=="None" (
    echo Task ARN: %TASK_ARN%
    aws ecs describe-tasks --cluster hyundai-login-cluster --tasks %TASK_ARN% --region ap-northeast-2 --query "tasks[0].{LastStatus:lastStatus,HealthStatus:healthStatus,StoppedReason:stoppedReason}"
) else (
    echo No tasks found
)

echo.
echo 4. Checking ALB target health...
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-2:716773066105:targetgroup/hyundai-login-tg/898916fb71ca683f --region ap-northeast-2

echo.
echo 5. Checking CloudWatch logs...
for /f "tokens=*" %%i in ('aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --region ap-northeast-2 --query "taskArns[0]" --output text') do set TASK_ARN=%%i
if not "%TASK_ARN%"=="None" (
    for /f "tokens=*" %%j in ('aws ecs describe-tasks --cluster hyundai-login-cluster --tasks %TASK_ARN% --region ap-northeast-2 --query "tasks[0].containers[0].logStreamPrefix" --output text') do set LOG_STREAM=%%j
    echo Log stream: %LOG_STREAM%
    aws logs get-log-events --log-group-name "/ecs/hyundai-login-app" --log-stream-name "%LOG_STREAM%" --region ap-northeast-2 --limit 10
) else (
    echo No tasks found for log checking
)

echo.
echo ========================================
echo Debug completed
echo ========================================
pause 