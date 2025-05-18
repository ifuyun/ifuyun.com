#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo -e "Starting build apps..."

SHELL_PATH=$(dirname $0)
cd $SHELL_PATH/..

echo -e "Building common..."
npm run build:common

echo -e "Building common:styles..."
npm run build:common:styles

echo -e "Building www..."
npm run build:www

echo -e "Building blog..."
npm run build:blog

echo -e "Building wallpaper..."
npm run build:wallpaper

echo -e "Building jigsaw..."
npm run build:jigsaw

echo -e "Building game..."
npm run build:game

echo -e "All done. ^_-"

exit 0