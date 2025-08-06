@echo off
REM AWS 인프라 설정 스크립트 (Windows CMD)
REM 사용법: setup-aws-infrastructure.bat

echo Setting up AWS infrastructure for Hyundai Login App...
echo.

REM AWS 계정 ID 가져오기
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
echo AWS Account ID: %ACCOUNT_ID%

REM 1. ECR 리포지토리 생성
echo Creating ECR repository...
aws ecr create-repository --repository-name hyundai-login-app --region ap-northeast-2 --image-scanning-configuration scanOnPush=true
echo ECR repository created successfully

REM 2. ECS 클러스터 생성
echo Creating ECS cluster...
aws ecs create-cluster --cluster-name hyundai-login-cluster --region ap-northeast-2
echo ECS cluster created successfully

REM 3. IAM 역할 생성
echo Creating IAM roles...

REM ECS Task Execution Role
aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"ecs-tasks.amazonaws.com\"},\"Action\":\"sts:AssumeRole\"}]}" 2>nul
if errorlevel 1 (
    echo ECS Task Execution Role already exists
) else (
    echo ECS Task Execution Role created successfully
)

aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
echo ECS Task Execution Role policy attached successfully

REM 4. VPC 및 네트워킹 설정
echo Setting up VPC and networking...

REM 기본 VPC 정보 가져오기
for /f "tokens=*" %%i in ('aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query "Vpcs[0].VpcId" --output text') do set VPC_ID=%%i
echo VPC ID: %VPC_ID%

REM 서브넷 정보 가져오기
for /f "tokens=1,2" %%a in ('aws ec2 describe-subnets --filters "Name=vpc-id,Values=%VPC_ID%" --query "Subnets[*].SubnetId" --output text') do (
    set SUBNET_1=%%a
    set SUBNET_2=%%b
)
echo Subnet 1: %SUBNET_1%
echo Subnet 2: %SUBNET_2%

REM 보안 그룹 생성
aws ec2 create-security-group --group-name hyundai-login-sg --description "Security group for Hyundai Login App" --vpc-id %VPC_ID% 2>nul
if errorlevel 1 (
    echo Security group already exists, getting ID...
    for /f "tokens=*" %%i in ('aws ec2 describe-security-groups --filters "Name=group-name,Values=hyundai-login-sg" --query "SecurityGroups[0].GroupId" --output text') do set SECURITY_GROUP_ID=%%i
) else (
    for /f "tokens=*" %%i in ('aws ec2 describe-security-groups --filters "Name=group-name,Values=hyundai-login-sg" --query "SecurityGroups[0].GroupId" --output text') do set SECURITY_GROUP_ID=%%i
)
echo Security Group ID: %SECURITY_GROUP_ID%

REM 보안 그룹 규칙 추가 (이미 존재하는 경우 무시)
aws ec2 authorize-security-group-ingress --group-id %SECURITY_GROUP_ID% --protocol tcp --port 80 --cidr 0.0.0.0/0 2>nul
aws ec2 authorize-security-group-ingress --group-id %SECURITY_GROUP_ID% --protocol tcp --port 443 --cidr 0.0.0.0/0 2>nul
echo Security group rules added successfully

REM 5. Application Load Balancer 설정
echo Setting up Application Load Balancer...

REM ALB 생성 (이미 존재하는 경우 기존 ARN 사용)
aws elbv2 create-load-balancer --name hyundai-login-alb --subnets %SUBNET_1% %SUBNET_2% --security-groups %SECURITY_GROUP_ID% --region ap-northeast-2 2>nul
if errorlevel 1 (
    echo ALB already exists, getting ARN...
) else (
    echo ALB created successfully
)
for /f "tokens=*" %%i in ('aws elbv2 describe-load-balancers --names hyundai-login-alb --query "LoadBalancers[0].LoadBalancerArn" --output text --region ap-northeast-2') do set LOAD_BALANCER_ARN=%%i
echo ALB ARN: %LOAD_BALANCER_ARN%

REM Target Group 생성 (이미 존재하는 경우 기존 ARN 사용)
aws elbv2 create-target-group --name hyundai-login-tg --protocol HTTP --port 80 --vpc-id %VPC_ID% --target-type ip --region ap-northeast-2 2>nul
if errorlevel 1 (
    echo Target Group already exists, getting ARN...
) else (
    echo Target Group created successfully
)
for /f "tokens=*" %%i in ('aws elbv2 describe-target-groups --names hyundai-login-tg --query "TargetGroups[0].TargetGroupArn" --output text --region ap-northeast-2') do set TARGET_GROUP_ARN=%%i
echo Target Group ARN: %TARGET_GROUP_ARN%

REM Listener 생성 (이미 존재하는 경우 기존 ARN 사용)
aws elbv2 create-listener --load-balancer-arn %LOAD_BALANCER_ARN% --protocol HTTP --port 80 --default-actions "Type=forward,TargetGroupArn=%TARGET_GROUP_ARN%" --region ap-northeast-2 2>nul
if errorlevel 1 (
    echo Listener already exists, getting ARN...
) else (
    echo Listener created successfully
)
for /f "tokens=*" %%i in ('aws elbv2 describe-listeners --load-balancer-arn %LOAD_BALANCER_ARN% --query "Listeners[0].ListenerArn" --output text --region ap-northeast-2') do set LISTENER_ARN=%%i
echo Listener ARN: %LISTENER_ARN%

REM 6. 설정 파일 업데이트
echo Updating configuration files...

REM ecs-task-definition.json 업데이트
powershell -Command "(Get-Content ecs-task-definition.json) -replace 'ACCOUNT_ID', '%ACCOUNT_ID%' | Set-Content ecs-task-definition.json"
echo Task definition updated successfully

REM 7. ECS 서비스 생성
echo Creating ECS service...

REM Task Definition 등록
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json --region ap-northeast-2
echo Task definition registered successfully

REM 서비스 생성 (이미 존재하는 경우 업데이트)
aws ecs create-service --cluster hyundai-login-cluster --service-name hyundai-login-service --task-definition hyundai-login-task --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[%SUBNET_1%,%SUBNET_2%],securityGroups=[%SECURITY_GROUP_ID%],assignPublicIp=ENABLED}" --load-balancers "targetGroupArn=%TARGET_GROUP_ARN%,containerName=hyundai-login-app,containerPort=80" --region ap-northeast-2 2>nul
if errorlevel 1 (
    echo Service already exists, updating...
    aws ecs update-service --cluster hyundai-login-cluster --service hyundai-login-service --task-definition hyundai-login-task --region ap-northeast-2
) else (
    echo ECS service created successfully
)

REM 8. ALB DNS 이름 출력
echo Getting ALB DNS name...
for /f "tokens=*" %%i in ('aws elbv2 describe-load-balancers --names hyundai-login-alb --query "LoadBalancers[0].DNSName" --output text --region ap-northeast-2') do set ALB_DNS=%%i
echo.
echo ========================================
echo AWS infrastructure setup completed!
echo ========================================
echo.
echo Application Load Balancer DNS: %ALB_DNS%
echo.
echo You can now access the login page at:
echo http://%ALB_DNS%
echo.
echo Next steps:
echo 1. Set up GitHub Secrets
echo 2. Push code to trigger GitHub Actions
echo 3. Monitor deployment in GitHub Actions
echo.
pause 