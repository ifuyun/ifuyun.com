@echo off
setlocal

echo Starting deploy apps...

REM Navigate to the project root directory
pushd "%~dp0.."

echo Deploying www...
npm run deploy:zip:www
if errorlevel 1 (
    echo Error during deploy:zip:www
    popd
    exit /b 1
)

echo Deploying blog...
npm run deploy:zip:blog
if errorlevel 1 (
    echo Error during deploy:zip:blog
    popd
    exit /b 1
)

echo Deploying wallpaper...
npm run deploy:zip:wallpaper
if errorlevel 1 (
    echo Error during deploy:zip:wallpaper
    popd
    exit /b 1
)

echo Deploying jigsaw...
npm run deploy:zip:jigsaw
if errorlevel 1 (
    echo Error during deploy:zip:jigsaw
    popd
    exit /b 1
)

echo Deploying game...
npm run deploy:zip:game
if errorlevel 1 (
    echo Error during deploy:zip:game
    popd
    exit /b 1
)

popd
echo All done. ^_-
endlocal
exit /b 0