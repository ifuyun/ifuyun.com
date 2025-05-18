@echo off
setlocal

echo Starting zip apps...

REM Navigate to the project root directory
pushd "%~dp0.."

echo Zipping www...
call npm run build:win:zip:www
if errorlevel 1 (
    echo Error during build:win:zip:www
    popd
    exit /b 1
)

echo Zipping blog...
call npm run build:win:zip:blog
if errorlevel 1 (
    echo Error during build:win:zip:blog
    popd
    exit /b 1
)

echo Zipping wallpaper...
call npm run build:win:zip:wallpaper
if errorlevel 1 (
    echo Error during build:win:zip:wallpaper
    popd
    exit /b 1
)

echo Zipping jigsaw...
call npm run build:win:zip:jigsaw
if errorlevel 1 (
    echo Error during build:win:zip:jigsaw
    popd
    exit /b 1
)

echo Zipping game...
call npm run build:win:zip:game
if errorlevel 1 (
    echo Error during build:win:zip:game
    popd
    exit /b 1
)

popd
echo All done. ^_-
endlocal
exit /b 0