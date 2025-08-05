@echo off
REM 불필요한 워크플로우 파일 삭제 스크립트 (Windows CMD)
REM 사용법: cleanup-workflows.bat

echo Cleaning up unnecessary workflow files...
echo.

echo Current workflow files:
dir .github\workflows\*.yml

echo.
echo Deleting docker-deploy.yml...
if exist ".github\workflows\docker-deploy.yml" (
    del ".github\workflows\docker-deploy.yml"
    echo docker-deploy.yml deleted
) else (
    echo docker-deploy.yml not found
)

echo.
echo Deleting ecs-deploy.yml...
if exist ".github\workflows\ecs-deploy.yml" (
    del ".github\workflows\ecs-deploy.yml"
    echo ecs-deploy.yml deleted
) else (
    echo ecs-deploy.yml not found
)

echo.
echo Remaining workflow files:
dir .github\workflows\*.yml

echo.
echo Cleanup completed!
pause 