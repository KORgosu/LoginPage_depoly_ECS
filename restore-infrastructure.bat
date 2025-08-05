@echo off
chcp 65001 >nul
echo ========================================
echo Restore AWS Infrastructure
echo ========================================
echo.

echo 1. Creating ECR repository...
aws ecr create-repository --repository-name hyundai-login-app --region ap-northeast-2 2>nul
echo ECR repository created/verified

echo.
echo 2. Creating ECS cluster...
aws ecs create-cluster --cluster-name hyundai-login-cluster --region ap-northeast-2 2>nul
echo ECS cluster created/verified

echo.
echo 3. Creating CloudWatch log group...
aws logs create-log-group --log-group-name "/ecs/hyundai-login-app" --region ap-northeast-2 2>nul
echo CloudWatch log group created/verified

echo.
echo 4. Checking ALB...
aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 2>nul
if %errorlevel% neq 0 (
    echo ALB not found. Please run setup-aws-infrastructure.bat first
    pause
    exit /b
)
echo ALB exists

echo.
echo 5. Checking Target Group...
aws elbv2 describe-target-groups --names hyundai-login-tg --region ap-northeast-2 2>nul
if %errorlevel% neq 0 (
    echo Target Group not found. Please run setup-aws-infrastructure.bat first
    pause
    exit /b
)
echo Target Group exists

echo.
echo 6. Checking ECS service...
aws ecs describe-services --cluster hyundai-login-cluster --services hyundai-login-service --region ap-northeast-2 2>nul
if %errorlevel% neq 0 (
    echo ECS service not found. Creating...
    aws ecs create-service --cluster hyundai-login-cluster --service-name hyundai-login-service --task-definition hyundai-login-task --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-05f134646eb92fb37,subnet-07fa1cc2e8a85f194],securityGroups=[sg-021845248fabfca17],assignPublicIp=ENABLED}" --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:ap-northeast-2:716773066105:targetgroup/hyundai-login-tg/898916fb71ca683f,containerName=hyundai-login-app,containerPort=80" --region ap-northeast-2
) else (
    echo ECS service exists
)

echo.
echo ========================================
echo Infrastructure restored!
echo ========================================
echo.
echo Next steps:
echo 1. Run fix-git-push.bat to trigger deployment
echo 2. Check GitHub Actions: https://github.com/KORgosu/LoginPage_depoly_ECS/actions
echo.
pause 