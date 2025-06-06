@echo off
setlocal enabledelayedexpansion

echo [deploy] Starting deployment...

set "APP_NAME="

REM Parse command line arguments
set "skip_next=false"
for %%A in (%*) do (
    if "!skip_next!"=="true" (
        set "APP_NAME=%%~A"
        set "skip_next=false"
    ) else (
        if /I "%%~A"=="--app" (
            set "skip_next=true"
        ) else if /I "%%~A:~0,6"=="--app=" (
            set "APP_NAME=%%~A:~6"
        )
    )
)
if not defined APP_NAME (
    echo Error: APP_NAME is not set. Please provide it using --app=^<app_name^> or --app ^<app_name^>
    exit /b 1
)

set "PM2_APP_NAME=%APP_NAME%.ifuyun.com"

REM Get script's directory and change to project root
pushd "%~dp0.."

REM pull code
echo [git] Pulling from GitHub...
echo [git] Path: %CD%
git fetch origin master && git reset --hard origin/master && git pull origin master
if errorlevel 1 (
    echo Error during git pull.
    popd
    exit /b 1
)
git checkout master
if errorlevel 1 (
    echo Error during git checkout master.
    popd
    exit /b 1
)
echo [git] Pulled master.

REM install dependencies
echo [install] Installing dependencies...
npm install
echo [install] Installed.

REM stop server
echo [server] Stopping server...
pm2 stop %PM2_APP_NAME% -s
REM We don't check errorlevel strictly here as pm2 stop might return non-zero if already stopped
echo [server] Server: %PM2_APP_NAME% is stopped.

REM build
echo [build] Building...
npm run build:prod:%APP_NAME%
echo [build] Built.

REM restart server
echo [server] Restarting server...
pm2 restart %PM2_APP_NAME%
if errorlevel 1 (
    echo Error restarting server %PM2_APP_NAME%.
    popd
    exit /b 1
)
echo [server] Server: %PM2_APP_NAME% is online.

popd
echo [deploy] All done. ^_-

endlocal
exit /b 0