@echo off
setlocal

echo Starting build apps...

REM Navigate to the project root directory
pushd "%~dp0.."

echo Building common...
call npm run build:common
if errorlevel 1 (
    echo Error during build:common
    popd
    exit /b 1
)

echo Building common:styles...
call npm run build:common:styles
if errorlevel 1 (
    echo Error during build:common:styles
    popd
    exit /b 1
)

echo Building www...
call npm run build:www
if errorlevel 1 (
    echo Error during build:www
    popd
    exit /b 1
)

echo Building blog...
call npm run build:blog
if errorlevel 1 (
    echo Error during build:blog
    popd
    exit /b 1
)

echo Building wallpaper...
call npm run build:wallpaper
if errorlevel 1 (
    echo Error during build:wallpaper
    popd
    exit /b 1
)

echo Building jigsaw...
call npm run build:jigsaw
if errorlevel 1 (
    echo Error during build:jigsaw
    popd
    exit /b 1
)

echo Building game...
call npm run build:game
if errorlevel 1 (
    echo Error during build:game
    popd
    exit /b 1
)

popd
echo All done. ^_-
endlocal
exit /b 0