@echo off
chcp 65001 >nul
echo ========================================
echo Delete Resources in Correct Order
echo ========================================
echo.
echo This script deletes resources in the correct order:
echo 1. ECS Service (removes targets from ALB)
echo 2. ALB Listeners
echo 3. Target Groups
echo 4. ALB
echo 5. Other resources
echo.
set /p CONFIRM="Continue? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Operation cancelled.
    pause
    exit /b
)

echo.
echo ========================================
echo Step 1: Delete ECS Service
echo ========================================
echo Scaling down ECS service to 0...
aws ecs update-service --cluster hyundai-login-cluster --service hyundai-login-service --desired-count 0 --region ap-northeast-2

echo Waiting 30 seconds for tasks to stop...
timeout /t 30 /nobreak >nul

echo Deleting ECS service...
aws ecs delete-service --cluster hyundai-login-cluster --service hyundai-login-service --force --region ap-northeast-2

echo.
echo ========================================
echo Step 2: Delete ALB Listeners
echo ========================================
echo Getting ALB ARN dynamically...
for /f "tokens=*" %%i in ('aws elbv2 describe-load-balancers --names hyundai-login-alb --region ap-northeast-2 --query "LoadBalancers[0].LoadBalancerArn" --output text') do set ALB_ARN=%%i
echo ALB ARN: %ALB_ARN%

echo Checking and deleting ALB listeners...
for /f "tokens=*" %%i in ('aws elbv2 describe-listeners --load-balancer-arn %ALB_ARN% --region ap-northeast-2 --query "Listeners[0].ListenerArn" --output text') do set LISTENER_ARN=%%i
if not "%LISTENER_ARN%"=="None" (
    echo Deleting listener: %LISTENER_ARN%
    aws elbv2 delete-listener --listener-arn %LISTENER_ARN% --region ap-northeast-2
) else (
    echo No listeners found
)

echo.
echo ========================================
echo Step 3: Delete Target Groups
echo ========================================
echo Getting Target Group ARN dynamically...
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
echo ========================================
echo Step 4: Delete ALB
echo ========================================
echo Deleting ALB...
aws elbv2 delete-load-balancer --load-balancer-arn %ALB_ARN% --region ap-northeast-2

echo.
echo ========================================
echo Step 5: Delete Other Resources
echo ========================================
echo Deleting ECS cluster...
aws ecs delete-cluster --cluster hyundai-login-cluster --region ap-northeast-2

echo Deleting ECR repository...
aws ecr delete-repository --repository-name hyundai-login-app --force --region ap-northeast-2

echo Deleting security group...
aws ec2 delete-security-group --group-id sg-021845248fabfca17 --region ap-northeast-2

echo Deleting additional subnet...
aws ec2 delete-subnet --subnet-id subnet-05f134646eb92fb37 --region ap-northeast-2

echo Deleting CloudWatch log group...
aws logs delete-log-group --log-group-name "/ecs/hyundai-login-app" --region ap-northeast-2

echo.
echo ========================================
echo All resources deleted successfully!
echo ========================================
pause 