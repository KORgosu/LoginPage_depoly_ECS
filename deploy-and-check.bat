@echo off
chcp 65001 >nul
echo ========================================
echo Deployment Status Check
echo ========================================
echo.

echo 1. Checking ECS service status...
aws ecs describe-services --cluster hyundai-login-cluster --services hyundai-login-service --region ap-northeast-2 --query "services[0].status" --output text

echo.
echo 2. Getting ALB DNS name...
for /f "tokens=*" %%i in ('aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 --query "LoadBalancers[0].DNSName" --output text') do set ALB_DNS=%%i
echo ALB DNS: %ALB_DNS%

echo.
echo 3. Opening ALB URL in browser...
start http://%ALB_DNS%

echo.
echo ========================================
echo Deployment check completed
echo ========================================
echo.
echo ALB URL: http://%ALB_DNS%
echo.
pause 