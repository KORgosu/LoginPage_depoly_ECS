@echo off
chcp 65001 >nul
echo ========================================
echo Share ALB URL
echo ========================================
echo.

echo 1. Getting ALB DNS name...
for /f "tokens=*" %%i in ('aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 --query "LoadBalancers[0].DNSName" --output text') do set ALB_DNS=%%i

echo.
echo 2. ALB URL Information:
echo ========================================
echo ALB DNS: %ALB_DNS%
echo Full URL: http://%ALB_DNS%
echo ========================================

echo.
echo 3. Copying URL to clipboard...
echo http://%ALB_DNS% | clip

echo.
echo 4. Opening ALB URL in browser...
start http://%ALB_DNS%

echo.
echo ========================================
echo URL Information
echo ========================================
echo.
echo ALB URL: http://%ALB_DNS%
echo.
echo URL has been copied to clipboard!
echo Browser will open automatically.
echo.
echo Share this URL with others:
echo http://%ALB_DNS%
echo.
pause 