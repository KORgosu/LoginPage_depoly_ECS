@echo off
REM package-lock.json 수정 스크립트 (Windows CMD)
REM 사용법: fix-package-lock.bat

echo Fixing package-lock.json...
echo.

echo Removing old package-lock.json...
if exist "package-lock.json" (
    del package-lock.json
    echo package-lock.json deleted
) else (
    echo package-lock.json not found
)

echo.
echo Installing dependencies to generate new package-lock.json...
npm install

echo.
echo New package-lock.json generated successfully!
echo.
pause 