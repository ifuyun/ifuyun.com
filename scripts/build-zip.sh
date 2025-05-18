#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo -e "Starting zip apps..."

SHELL_PATH=$(dirname $0)
cd $SHELL_PATH/..

echo -e "Zipping www..."
npm run build:zip:www

echo -e "Zipping blog..."
npm run build:zip:blog

echo -e "Zipping wallpaper..."
npm run build:zip:wallpaper

echo -e "Zipping jigsaw..."
npm run build:zip:jigsaw

echo -e "Zipping game..."
npm run build:zip:game

echo -e "All done. ^_-"

exit 0