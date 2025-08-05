@echo off
REM 실패한 리소스 정리 및 재설정 스크립트 (Windows CMD)
REM 사용법: cleanup-and-retry.bat

echo Cleaning up failed resources and retrying setup...
echo.

REM 1. 실패한 ECS 서비스 삭제
echo 1. Cleaning up failed ECS service...
aws ecs update-service --cluster hyundai-login-cluster --service hyundai-login-service --desired-count 0 --region ap-northeast-2 2>nul
if errorlevel 1 (
    echo ECS service not found or already stopped
) else (
    echo ECS service scaled down to 0
    timeout /t 30 /nobreak >nul
    aws ecs delete-service --cluster hyundai-login-cluster --service hyundai-login-service --region ap-northeast-2 2>nul
    echo ECS service deleted
)

REM 2. 실패한 Target Group 삭제
echo 2. Cleaning up failed Target Group...
aws elbv2 delete-target-group --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-2:716773066105:targetgroup/hyundai-login-tg/703f30a52c3120c5 --region ap-northeast-2 2>nul
if errorlevel 1 (
    echo Target Group not found or already deleted
) else (
    echo Target Group deleted
)

REM 3. 추가 서브넷 생성
echo 3. Creating additional subnet...
call create-additional-subnet.bat

REM 4. AWS 인프라 재설정
echo 4. Retrying AWS infrastructure setup...
call setup-aws-infrastructure.bat

echo.
echo Cleanup and retry completed!
pause 