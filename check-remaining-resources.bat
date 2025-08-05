@echo off
REM 남은 AWS 리소스 확인 스크립트 (Windows CMD)
REM 사용법: check-remaining-resources.bat

echo ========================================
echo 남은 AWS 리소스 확인
echo ========================================
echo.

echo 1. ECS 클러스터 확인...
aws ecs list-clusters --region ap-northeast-2

echo.
echo 2. ECS 서비스 확인...
aws ecs list-services --cluster hyundai-login-cluster --region ap-northeast-2 2>nul || echo 클러스터가 존재하지 않습니다.

echo.
echo 3. ECR 리포지토리 확인...
aws ecr describe-repositories --repository-names hyundai-login-app --region ap-northeast-2 2>nul || echo 리포지토리가 존재하지 않습니다.

echo.
echo 4. ALB 확인...
aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 2>nul || echo ALB가 존재하지 않습니다.

echo.
echo 5. Target Group 확인...
aws elbv2 describe-target-groups --names hyundai-login-tg --region ap-northeast-2 2>nul || echo Target Group이 존재하지 않습니다.

echo.
echo 6. 보안 그룹 확인...
aws ec2 describe-security-groups --group-ids sg-021845248fabfca17 --region ap-northeast-2 2>nul || echo 보안 그룹이 존재하지 않습니다.

echo.
echo 7. 추가 서브넷 확인...
aws ec2 describe-subnets --subnet-ids subnet-05f134646eb92fb37 --region ap-northeast-2 2>nul || echo 추가 서브넷이 존재하지 않습니다.

echo.
echo 8. CloudWatch 로그 그룹 확인...
aws logs describe-log-groups --log-group-name-prefix "/ecs/hyundai-login-app" --region ap-northeast-2

echo.
echo 9. IAM 역할 확인...
aws iam get-role --role-name ecsTaskExecutionRole --region ap-northeast-2 2>nul || echo IAM 역할이 존재하지 않습니다.

echo.
echo ========================================
echo 확인 완료
echo ========================================
pause 