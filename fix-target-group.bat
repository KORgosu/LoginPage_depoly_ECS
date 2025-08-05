@echo off
chcp 65001 >nul
echo ========================================
echo Fix Target Group
echo ========================================
echo.

echo 1. Creating Target Group...
aws elbv2 create-target-group --name hyundai-login-tg --protocol HTTP --port 80 --vpc-id vpc-09089a6ae15a1fbf3 --target-type ip --region ap-northeast-2

echo.
echo 2. Getting Target Group ARN...
for /f "tokens=*" %%i in ('aws elbv2 describe-target-groups --names hyundai-login-tg --region ap-northeast-2 --query "TargetGroups[0].TargetGroupArn" --output text') do set TARGET_GROUP_ARN=%%i
echo Target Group ARN: %TARGET_GROUP_ARN%

echo.
echo 3. Creating ALB listener...
aws elbv2 create-listener --load-balancer-arn arn:aws:elasticloadbalancing:ap-northeast-2:716773066105:loadbalancer/app/hyundai-login-alb/f52689f8624aaeb4 --protocol HTTP --port 80 --default-actions "Type=forward,TargetGroupArn=%TARGET_GROUP_ARN%" --region ap-northeast-2

echo.
echo 4. Updating ECS service with new Target Group...
aws ecs update-service --cluster hyundai-login-cluster --service hyundai-login-service --load-balancers "targetGroupArn=%TARGET_GROUP_ARN%,containerName=hyundai-login-app,containerPort=80" --region ap-northeast-2

echo.
echo 5. Checking Target Group health...
aws elbv2 describe-target-health --target-group-arn %TARGET_GROUP_ARN% --region ap-northeast-2

echo.
echo ========================================
echo Target Group fixed!
echo ========================================
echo.
echo Next steps:
echo 1. Wait 2-3 minutes for ECS service to update
echo 2. Run debug-alb-timeout.bat to verify
echo 3. Test ALB URL: http://hyundai-login-alb-1386251550.ap-northeast-2.elb.amazonaws.com
echo.
pause 