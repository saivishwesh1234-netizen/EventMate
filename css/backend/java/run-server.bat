@echo off
echo ===================================================
echo   Compiling and Starting Event Mate Java Backend...
echo ===================================================

if not exist "bin" mkdir bin

javac -d bin src\com\eventmate\EventMateServer.java
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed. Please make sure Java JDK is installed and in your PATH.
    pause
    exit /b %errorlevel%
)

echo [SUCCESS] Compiled! Starting server on http://localhost:8080 ...
java -cp bin com.eventmate.EventMateServer
pause
