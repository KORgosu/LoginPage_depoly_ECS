@echo off
REM ECS 서비스 생성 스크립트 (Windows CMD)
REM 사용법: create-ecs-service.bat

echo Creating ECS service...

aws ecs create-service --cluster hyundai-login-cluster --service-name hyundai-login-service --task-definition hyundai-login-task --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-05f134646eb92fb37,subnet-07fa1cc2e8a85f194],securityGroups=[sg-021845248fabfca17],assignPublicIp=ENABLED}" --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:ap-northeast-2:716773066105:targetgroup/hyundai-login-tg/898916fb71ca683f,containerName=hyundai-login-app,containerPort=80" --region ap-northeast-2

echo.
echo ECS service creation completed!
echo.
echo You can now access the login page at:
echo http://hyundai-login-alb-297074594.ap-northeast-2.elb.amazonaws.com
echo.
pause 