@echo off
chcp 65001 >nul
echo ========================================
echo Quick Start - Login Page Deployment
echo ========================================
echo.

echo 1. Checking current deployment status...
aws ecs describe-services --cluster hyundai-login-cluster --services hyundai-login-service --region ap-northeast-2 --query "services[0].{Status:status,RunningCount:runningCount}" --output table

echo.
echo 2. Getting ALB URL...
for /f "tokens=*" %%i in ('aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 --query "LoadBalancers[0].DNSName" --output text') do set ALB_DNS=%%i
echo ALB URL: http://%ALB_DNS%

echo.
echo 3. Opening login page...
start http://%ALB_DNS%

echo.
echo ========================================
echo Quick Start Summary
echo ========================================
echo.
echo Login Page URL: http://%ALB_DNS%
echo.
echo If the page doesn't load:
echo 1. Run: start-aws-services.bat
echo 2. Wait 5-10 minutes
echo 3. Run: check-deployment-status.bat
echo.
echo To share URL: share-alb-url.bat
echo To cleanup: cleanup-all-aws-resources.bat
echo.
pause 