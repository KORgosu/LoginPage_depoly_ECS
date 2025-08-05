@echo off
REM 추가 서브넷 생성 스크립트 (Windows CMD)
REM 사용법: create-additional-subnet.bat

echo Creating additional subnet for ALB...
echo.

REM 기본 VPC 정보 가져오기
for /f "tokens=*" %%i in ('aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query "Vpcs[0].VpcId" --output text') do set VPC_ID=%%i
echo VPC ID: %VPC_ID%

REM 기존 서브넷 정보 가져오기
echo Existing subnets:
aws ec2 describe-subnets --filters "Name=vpc-id,Values=%VPC_ID%" --query "Subnets[*].{SubnetId:SubnetId,AvailabilityZone:AvailabilityZone,CidrBlock:CidrBlock}" --output table

REM 사용 가능한 AZ 확인
for /f "tokens=*" %%i in ('aws ec2 describe-availability-zones --region ap-northeast-2 --query "AvailabilityZones[*].ZoneName" --output text') do set AZS=%%i
echo Available AZs: %AZS%

REM 기존 서브넷이 사용하는 AZ 확인
for /f "tokens=*" %%i in ('aws ec2 describe-subnets --filters "Name=vpc-id,Values=%VPC_ID%" --query "Subnets[*].AvailabilityZone" --output text') do set USED_AZS=%%i
echo Used AZs: %USED_AZS%

REM 새 서브넷을 위한 AZ 선택 (첫 번째 AZ 사용)
for /f "tokens=1" %%a in ("%AZS%") do set NEW_AZ=%%a
echo Selected AZ for new subnet: %NEW_AZ%

REM VPC CIDR 범위 확인
for /f "tokens=*" %%i in ('aws ec2 describe-vpcs --vpc-ids %VPC_ID% --query "Vpcs[0].CidrBlock" --output text') do set VPC_CIDR=%%i
echo VPC CIDR: %VPC_CIDR%

REM 새 CIDR 블록 (VPC CIDR 범위 내에서)
set NEW_CIDR=172.31.48.0/20
echo Creating subnet with CIDR: %NEW_CIDR% in AZ: %NEW_AZ%

REM 새 서브넷 생성
for /f "tokens=*" %%i in ('aws ec2 create-subnet --vpc-id %VPC_ID% --cidr-block %NEW_CIDR% --availability-zone %NEW_AZ% --region ap-northeast-2 --query "Subnet.{SubnetId:SubnetId,AvailabilityZone:AvailabilityZone,CidrBlock:CidrBlock}" --output json') do set NEW_SUBNET=%%i
echo New subnet created successfully!
echo %NEW_SUBNET%

echo.
echo Now you can run the infrastructure setup script again:
echo setup-aws-infrastructure.bat
pause 