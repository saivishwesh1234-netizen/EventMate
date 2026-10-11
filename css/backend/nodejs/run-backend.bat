@echo off
echo ====================================================
echo   Starting Event Mate JavaScript Backend (Node.js)...
echo ====================================================

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [NOTICE] Node.js is not installed or not in your PATH.
    echo.
    echo Good news: You do NOT need to install anything!
    echo Event Mate has a full client-side JavaScript engine built into the frontend.
    echo Just double-click index.html in the main folder to run the entire app!
    echo.
    pause
    exit /b
)

echo [SUCCESS] Node.js detected! Starting backend on port 5000...
node server.js
pause
