@echo off
setlocal enabledelayedexpansion

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

REM Get project root directory
pushd "%~dp0.."
set "PROJECT_ROOT=%CD%"

REM Get version from package.json
set "VERSION_RAW="
for /f "delims=" %%i in ('npm pkg get version') do set "VERSION_RAW=%%i"

REM Remove quotes from version
set "VERSION=!VERSION_RAW:"=!"
if not defined VERSION (
    echo Error: Could not determine version from npm.
    popd
    exit /b 1
)

set "ZIP_FILENAME=release_!APP_NAME!_!VERSION!.zip"
set "SOURCE_DIR=!PROJECT_ROOT!\dist\!APP_NAME!"
set "OUTPUT_ZIP_PATH=!PROJECT_ROOT!\!ZIP_FILENAME!"

REM Check if source directory exists
if not exist "!SOURCE_DIR!" (
    echo Error: Source directory !SOURCE_DIR! not found.
    popd
    exit /b 1
)

echo [build] Zipping !SOURCE_DIR! ...

REM Delete existing zip file if it exists, to avoid issues with Compress-Archive
if exist "!OUTPUT_ZIP_PATH!" (
    del "!OUTPUT_ZIP_PATH!"
)

REM Use PowerShell to create the archive
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '!SOURCE_DIR!' | Compress-Archive -DestinationPath '!OUTPUT_ZIP_PATH!' -Force"

if errorlevel 1 (
    echo Error during zip operation.
    popd
    exit /b 1
)

echo [build] Zipped, file: !OUTPUT_ZIP_PATH!.

popd
endlocal
exit /b 0