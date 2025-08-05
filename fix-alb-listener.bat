@echo off
chcp 65001 >nul
echo ========================================
echo Fix ALB Listener
echo ========================================
echo.

echo 1. Checking ALB...
aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 --query "LoadBalancers[0].{DNSName:DNSName,LoadBalancerArn:LoadBalancerArn}"

echo.
echo 2. Checking ALB listeners...
aws elbv2 describe-listeners --load-balancer-arn arn:aws:elasticloadbalancing:ap-northeast-2:716773066105:loadbalancer/app/hyundai-login-alb/f52689f8624aaeb4 --region ap-northeast-2

echo.
echo 3. Creating listener if it doesn't exist...
aws elbv2 create-listener --load-balancer-arn arn:aws:elasticloadbalancing:ap-northeast-2:716773066105:loadbalancer/app/hyundai-login-alb/f52689f8624aaeb4 --protocol HTTP --port 80 --default-actions "Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:ap-northeast-2:716773066105:targetgroup/hyundai-login-tg/898916fb71ca683f" --region ap-northeast-2 2>nul
if %errorlevel% equ 0 (
    echo Listener created successfully
) else (
    echo Listener already exists or error occurred
)

echo.
echo 4. Checking Target Group...
aws elbv2 describe-target-groups --names hyundai-login-tg --region ap-northeast-2 --query "TargetGroups[0].{TargetGroupArn:TargetGroupArn,Port:Port,Protocol:Protocol}"

echo.
echo 5. Checking Target Group health...
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-2:716773066105:targetgroup/hyundai-login-tg/898916fb71ca683f --region ap-northeast-2

echo.
echo ========================================
echo ALB listener check completed
echo ========================================
pause 