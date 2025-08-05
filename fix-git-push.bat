@echo off
chcp 65001 >nul
echo ========================================
echo Fix Git Push and Trigger Deployment
echo ========================================
echo.

echo 1. Checking current branch...
git branch

echo.
echo 2. Adding all changes...
git add .

echo.
echo 3. Committing changes...
git commit -m "Update deployment scripts - %date% %time%"

echo.
echo 4. Pushing to GitHub (master branch)...
git push origin master

echo.
echo ========================================
echo Git push completed!
echo ========================================
echo.
echo Next steps:
echo 1. Check GitHub Actions: https://github.com/KORgosu/LoginPage_depoly_ECS/actions
echo 2. Wait for deployment to complete (usually 5-10 minutes)
echo 3. Run deploy-and-check.bat to verify deployment
echo.
pause 