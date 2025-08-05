@echo off
chcp 65001 >nul
echo ========================================
echo Deployment Status Check
echo ========================================
echo.

echo 1. ECS Service Status:
aws ecs describe-services --cluster hyundai-login-cluster --services hyundai-login-service --region ap-northeast-2 --query "services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount}" --output table

echo.
echo 2. ALB URL:
for /f "tokens=*" %%i in ('aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 --query "LoadBalancers[0].DNSName" --output text') do set ALB_DNS=%%i
echo http://%ALB_DNS%

echo.
echo 3. Target Health:
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-2:716773066105:targetgroup/hyundai-login-tg/898916fb71ca683f --region ap-northeast-2 --query "TargetHealthDescriptions[0].{TargetId:Target.Id,Port:Target.Port,Health:TargetHealth.State}" --output table

echo.
echo ========================================
echo Quick Status Summary
echo ========================================
echo.
echo ALB URL: http://%ALB_DNS%
echo.
echo To share URL: share-alb-url.bat
echo To cleanup all: cleanup-all-aws-resources.bat
echo.
pause 