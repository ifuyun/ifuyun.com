#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo -e "Starting deploy apps..."

SHELL_PATH=$(dirname $0)
cd $SHELL_PATH/..

echo -e "Deploying www..."
npm run deploy:zip:www

echo -e "Deploying blog..."
npm run deploy:zip:blog

echo -e "Deploying wallpaper..."
npm run deploy:zip:wallpaper

echo -e "Deploying jigsaw..."
npm run deploy:zip:jigsaw

echo -e "Deploying game..."
npm run deploy:zip:game

echo -e "All done. ^_-"

exit 0