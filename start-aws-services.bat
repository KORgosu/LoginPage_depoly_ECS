@echo off
chcp 65001 >nul
echo ========================================
echo Start AWS Services and Deploy Login Page
echo ========================================
echo.

echo Step 1: Restore AWS Infrastructure
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
    echo.
    echo Running setup-aws-infrastructure.bat...
    setup-aws-infrastructure.bat
) else (
    echo ALB exists
)

echo.
echo Step 2: Fix ALB Issue
echo ========================================
echo.
echo Fixing ALB and Target Group issues...
fix-alb-issue.bat

echo.
echo Step 3: Trigger Deployment
echo ========================================
echo.
echo Triggering GitHub Actions deployment...
git add .
git commit -m "Trigger deployment - %date% %time%"
git push origin master

echo.
echo Step 3: Wait for Deployment
echo ========================================
echo.
echo Deployment triggered! Please wait 5-10 minutes for completion.
echo.
echo You can check progress at:
echo https://github.com/KORgosu/LoginPage_depoly_ECS/actions
echo.
echo After deployment completes, run:
echo check-deployment-status.bat
echo.
pause 