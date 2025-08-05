@echo off
chcp 65001 >nul
echo ========================================
echo Trigger GitHub Actions Deployment
echo ========================================
echo.

echo 1. Checking current git status...
git status

echo.
echo 2. Adding all changes...
git add .

echo.
echo 3. Committing changes...
git commit -m "Trigger deployment - %date% %time%"

echo.
echo 4. Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo Deployment triggered successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Check GitHub Actions: https://github.com/[your-username]/[your-repo]/actions
echo 2. Wait for deployment to complete (usually 5-10 minutes)
echo 3. Run deploy-and-check.bat to verify deployment
echo.
pause 