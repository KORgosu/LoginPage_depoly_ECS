@echo off
chcp 65001 >nul
echo ========================================
echo Force Delete ALB
echo ========================================
echo.

echo 1. Checking ALB status...
aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 --query "LoadBalancers[0].{DNSName:DNSName,State:State.Code,LoadBalancerArn:LoadBalancerArn}"

echo.
echo 2. Getting ALB ARN dynamically...
for /f "tokens=*" %%i in ('aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 --query "LoadBalancers[0].LoadBalancerArn" --output text') do set ALB_ARN=%%i
echo ALB ARN: %ALB_ARN%

echo Checking ALB listeners...
aws elbv2 describe-listeners --load-balancer-arn %ALB_ARN% --region ap-northeast-2

echo.
echo 3. Deleting ALB listeners...
for /f "tokens=*" %%i in ('aws elbv2 describe-listeners --load-balancer-arn %ALB_ARN% --region ap-northeast-2 --query "Listeners[0].ListenerArn" --output text') do set LISTENER_ARN=%%i
if not "%LISTENER_ARN%"=="None" (
    echo Deleting listener: %LISTENER_ARN%
    aws elbv2 delete-listener --listener-arn %LISTENER_ARN% --region ap-northeast-2
) else (
    echo No listeners found
)

echo.
echo 4. Checking Target Groups...
aws elbv2 describe-target-groups --names hyundai-login-tg --region ap-northeast-2

echo.
echo 5. Getting Target Group ARN dynamically...
for /f "tokens=*" %%i in ('aws elbv2 describe-target-groups --names hyundai-login-tg --region ap-northeast-2 --query "TargetGroups[0].TargetGroupArn" --output text') do set TARGET_GROUP_ARN=%%i
echo Target Group ARN: %TARGET_GROUP_ARN%

echo Deleting Target Group...
aws elbv2 delete-target-group --target-group-arn %TARGET_GROUP_ARN% --region ap-northeast-2 2>nul
if %errorlevel% equ 0 (
    echo Target Group deleted successfully
) else (
    echo Target Group not found or already deleted
)

echo.
echo 6. Force deleting ALB...
aws elbv2 delete-load-balancer --load-balancer-arn %ALB_ARN% --region ap-northeast-2

echo.
echo 7. Verifying ALB deletion...
aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 2>nul
if %errorlevel% equ 0 (
    echo ALB still exists
) else (
    echo ALB deleted successfully
)

echo.
echo ========================================
echo ALB deletion completed
echo ========================================
pause 