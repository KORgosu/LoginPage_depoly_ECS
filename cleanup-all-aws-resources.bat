@echo off
REM 모든 AWS 리소스 정리 스크립트 (Windows CMD)
REM 사용법: cleanup-all-aws-resources.bat
REM 주의: 이 스크립트는 모든 리소스를 삭제합니다!

chcp 65001 >nul
echo ========================================
echo AWS Resources Cleanup
echo ========================================
echo.
echo Warning: This script will delete all the following resources:
echo - ECS Service and Cluster
echo - ECR Repository
echo - ALB and Target Group
echo - Security Groups
echo - Subnets (additional ones only)
echo - CloudWatch Log Groups
echo.
set /p CONFIRM="Are you sure you want to delete all resources? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Operation cancelled.
    pause
    exit /b
)

echo.
echo ========================================
echo 1. ECS 서비스 삭제
echo ========================================
echo ECS 서비스를 0으로 스케일링...
aws ecs update-service --cluster hyundai-login-cluster --service hyundai-login-service --desired-count 0 --region ap-northeast-2
echo 30초 대기 중...
timeout /t 30 /nobreak >nul

echo ECS 서비스 삭제...
aws ecs delete-service --cluster hyundai-login-cluster --service hyundai-login-service --force --region ap-northeast-2

echo.
echo ========================================
echo 2. ECS 클러스터 삭제
echo ========================================
echo ECS 클러스터 삭제...
aws ecs delete-cluster --cluster hyundai-login-cluster --region ap-northeast-2

echo.
echo ========================================
echo 3. ECR 리포지토리 삭제
echo ========================================
echo ECR 이미지 삭제...
aws ecr batch-delete-image --repository-name hyundai-login-app --image-ids imageTag=latest --region ap-northeast-2 2>nul
aws ecr batch-delete-image --repository-name hyundai-login-app --image-ids imageTag=main --region ap-northeast-2 2>nul

echo ECR 리포지토리 삭제...
aws ecr delete-repository --repository-name hyundai-login-app --force --region ap-northeast-2

echo.
echo ========================================
echo 4. ALB 및 Target Group 삭제
echo ========================================
echo Getting ALB ARN dynamically...
for /f "tokens=*" %%i in ('aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 --query "LoadBalancers[0].LoadBalancerArn" --output text') do set ALB_ARN=%%i
echo ALB ARN: %ALB_ARN%

echo ALB Listener 삭제...
for /f "tokens=*" %%i in ('aws elbv2 describe-listeners --load-balancer-arn %ALB_ARN% --region ap-northeast-2 --query "Listeners[0].ListenerArn" --output text') do set LISTENER_ARN=%%i
if not "%LISTENER_ARN%"=="None" (
    aws elbv2 delete-listener --listener-arn %LISTENER_ARN% --region ap-northeast-2
)

echo ALB 삭제...
aws elbv2 delete-load-balancer --load-balancer-arn %ALB_ARN% --region ap-northeast-2

echo Getting Target Group ARN dynamically...
for /f "tokens=*" %%i in ('aws elbv2 describe-target-groups --names hyundai-login-tg --region ap-northeast-2 --query "TargetGroups[0].TargetGroupArn" --output text') do set TARGET_GROUP_ARN=%%i
echo Target Group ARN: %TARGET_GROUP_ARN%

echo Target Group 삭제...
aws elbv2 delete-target-group --target-group-arn %TARGET_GROUP_ARN% --region ap-northeast-2

echo.
echo ========================================
echo 5. 보안 그룹 삭제
echo ========================================
echo 보안 그룹 삭제...
aws ec2 delete-security-group --group-id sg-021845248fabfca17 --region ap-northeast-2

echo.
echo ========================================
echo 6. 추가 서브넷 삭제
echo ========================================
echo 추가 서브넷 삭제...
aws ec2 delete-subnet --subnet-id subnet-05f134646eb92fb37 --region ap-northeast-2

echo.
echo ========================================
echo 7. CloudWatch 로그 그룹 삭제
echo ========================================
echo CloudWatch 로그 그룹 삭제...
aws logs delete-log-group --log-group-name "/ecs/hyundai-login-app" --region ap-northeast-2

echo.
echo ========================================
echo 8. IAM 역할 삭제 (선택사항)
echo ========================================
echo IAM 역할 삭제...
aws iam detach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
aws iam delete-role --role-name ecsTaskExecutionRole

echo.
echo ========================================
echo 정리 완료!
echo ========================================
echo.
echo 삭제된 리소스:
echo - ECS 서비스: hyundai-login-service
echo - ECS 클러스터: hyundai-login-cluster
echo - ECR 리포지토리: hyundai-login-app
echo - ALB: hyundai-login-alb
echo - Target Group: hyundai-login-tg
echo - 보안 그룹: sg-021845248fabfca17
echo - 추가 서브넷: subnet-05f134646eb92fb37
echo - CloudWatch 로그 그룹: /ecs/hyundai-login-app
echo - IAM 역할: ecsTaskExecutionRole
echo.
echo 모든 리소스가 성공적으로 삭제되었습니다.
pause 