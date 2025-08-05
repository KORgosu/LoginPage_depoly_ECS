@echo off
REM ECS 서비스 문제 진단 스크립트 (Windows CMD)
REM 사용법: debug-ecs-service.bat

echo ========================================
echo ECS 서비스 문제 진단
echo ========================================
echo.

echo 1. ECS 서비스 상태 확인...
aws ecs describe-services --cluster hyundai-login-cluster --services hyundai-login-service --region ap-northeast-2

echo.
echo 2. ECS 태스크 상태 확인...
aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --region ap-northeast-2

echo.
echo 3. 최근 태스크 상세 정보...
for /f "tokens=*" %%i in ('aws ecs list-tasks --cluster hyundai-login-cluster --service-name hyundai-login-service --region ap-northeast-2 --query "taskArns[0]" --output text') do set TASK_ARN=%%i
if not "%TASK_ARN%"=="None" (
    aws ecs describe-tasks --cluster hyundai-login-cluster --tasks %TASK_ARN% --region ap-northeast-2
) else (
    echo No tasks found
)

echo.
echo 4. ECR 이미지 확인...
aws ecr describe-images --repository-name hyundai-login-app --region ap-northeast-2

echo.
echo 5. 로드 밸런서 상태 확인...
aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2

echo.
echo 6. 타겟 그룹 상태 확인...
aws elbv2 describe-target-groups --names hyundai-login-tg --region ap-northeast-2

echo.
echo ========================================
echo 진단 완료
echo ========================================
pause 