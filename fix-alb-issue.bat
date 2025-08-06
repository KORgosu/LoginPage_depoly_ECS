@echo off
chcp 65001 >nul
echo ========================================
echo Fix ALB Issue
echo ========================================
echo.

echo 1. Checking existing ALB...
aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 2>nul
if %errorlevel% equ 0 (
    echo ALB exists, getting ARN...
    for /f "tokens=*" %%i in ('aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 --query "LoadBalancers[0].LoadBalancerArn" --output text') do set ALB_ARN=%%i
    echo ALB ARN: %ALB_ARN%
) else (
    echo ALB not found, creating new one...
    echo Creating additional subnet first...
    create-additional-subnet.bat
    echo.
    echo Now creating ALB...
    aws elbv2 create-load-balancer --name hyundai-login-alb --subnets subnet-07fa1cc2e8a85f194 subnet-05f134646eb92fb37 --security-groups sg-0ed50f1865c952ab3 --region ap-northeast-2
    for /f "tokens=*" %%i in ('aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 --query "LoadBalancers[0].LoadBalancerArn" --output text') do set ALB_ARN=%%i
    echo ALB ARN: %ALB_ARN%
)

echo.
echo 2. Creating Target Group...
aws elbv2 create-target-group --name hyundai-login-tg --protocol HTTP --port 80 --vpc-id vpc-09089a6ae15a1fbf3 --target-type ip --region ap-northeast-2 2>nul
if errorlevel 1 (
    echo Target Group already exists, getting ARN...
) else (
    echo Target Group created successfully
)
for /f "tokens=*" %%i in ('aws elbv2 describe-target-groups --names hyundai-login-tg --region ap-northeast-2 --query "TargetGroups[0].TargetGroupArn" --output text') do set TARGET_GROUP_ARN=%%i
echo Target Group ARN: %TARGET_GROUP_ARN%

echo.
echo 3. Creating ALB Listener...
aws elbv2 create-listener --load-balancer-arn %ALB_ARN% --protocol HTTP --port 80 --default-actions "Type=forward,TargetGroupArn=%TARGET_GROUP_ARN%" --region ap-northeast-2 2>nul
if errorlevel 1 (
    echo Listener already exists, getting ARN...
    for /f "tokens=*" %%i in ('aws elbv2 describe-listeners --load-balancer-arn %ALB_ARN% --query "Listeners[0].ListenerArn" --output text --region ap-northeast-2') do set LISTENER_ARN=%%i
    echo Listener ARN: %LISTENER_ARN%
) else (
    echo Listener created successfully
    for /f "tokens=*" %%i in ('aws elbv2 describe-listeners --load-balancer-arn %ALB_ARN% --query "Listeners[0].ListenerArn" --output text --region ap-northeast-2') do set LISTENER_ARN=%%i
    echo Listener ARN: %LISTENER_ARN%
)

echo.
echo 4. Updating ECS service...
aws ecs update-service --cluster hyundai-login-cluster --service hyundai-login-service --load-balancers "targetGroupArn=%TARGET_GROUP_ARN%,containerName=hyundai-login-app,containerPort=80" --region ap-northeast-2

echo.
echo 5. Getting ALB DNS name...
for /f "tokens=*" %%i in ('aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 --query "LoadBalancers[0].DNSName" --output text') do set ALB_DNS=%%i
echo ALB DNS: %ALB_DNS%

echo.
echo ========================================
echo ALB issue fixed!
echo ========================================
echo.
echo Login page URL: http://%ALB_DNS%
echo.
echo Next steps:
echo 1. Wait 2-3 minutes for ECS service to update
echo 2. Run: check-deployment-status.bat
echo 3. Test URL: http://%ALB_DNS%
echo.
pause 