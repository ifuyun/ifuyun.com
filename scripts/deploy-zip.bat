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

REM set version
for /f "tokens=*" %%i in ('npm pkg get version') do set "VERSION_RAW=%%i"
REM Remove quotes from version
set "VERSION=%VERSION_RAW:"=%"
set "ZIP_FILENAME=release_%APP_NAME%_%VERSION%.zip"

REM stop server
echo [server] Stopping server...
pm2 stop %PM2_APP_NAME% -s
REM We don't check errorlevel strictly here as pm2 stop might return non-zero if already stopped
echo [server] Server: %PM2_APP_NAME% is stopped.

REM unzip file
echo [unzip] Unzipping %ZIP_FILENAME%...
if not exist "%ZIP_FILENAME%" (
    echo Error: ZIP file %ZIP_FILENAME% not found.
    popd
    exit /b 1
)

REM Ensure release directory exists for the app
mkdir "release\%APP_NAME%" 2>nul

REM Use PowerShell to extract the archive
powershell -Command "Expand-Archive -Path '%ZIP_FILENAME%' -DestinationPath 'release\%APP_NAME%' -Force"
if errorlevel 1 (
    echo Error during unzip operation.
    popd
    exit /b 1
)

REM Remove old application directory
if exist "dist\%APP_NAME%" (
    echo [unzip] Removing old version from dist\%APP_NAME%...
    rd /s /q "dist\%APP_NAME%"
    if errorlevel 1 (
        echo Error removing old dist\%APP_NAME%.
        REM Continue, as it might not exist or be empty
    )
)

REM Ensure dist directory exists
mkdir "dist" 2>nul

REM Move new version to dist
echo [unzip] Moving release\%APP_NAME% to dist\%APP_NAME%...
move "release\%APP_NAME%" "dist\%APP_NAME%"
if errorlevel 1 (
    echo Error moving new version to dist.
    popd
    exit /b 1
)

REM Delete the zip file
del /q "%ZIP_FILENAME%"
echo [unzip] Unzipped and cleaned up.

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