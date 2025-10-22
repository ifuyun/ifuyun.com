#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo -e "Starting build apps..."

SHELL_PATH=$(dirname $0)
cd $SHELL_PATH/..

echo -e "Building common..."
npm run build:ng:common

echo -e "Building common:styles..."
npm run build:gulp:styles

echo -e "Building www..."
npm run build:ng:www

echo -e "Building blog..."
npm run build:ng:blog

echo -e "Building wallpaper..."
npm run build:ng:wallpaper

echo -e "Building jigsaw..."
npm run build:ng:jigsaw

echo -e "Building game..."
npm run build:ng:game

echo -e "All done. ^_-"

exit 0