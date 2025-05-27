#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo -e "Starting deploy apps..."

SHELL_PATH=$(dirname $0)
cd $SHELL_PATH/..

# pull code
echo -e "\033[95m[git]\033[0m Pulling from GitHub..."
echo -e "\033[95m[git]\033[0m Path: \033[36m"$(pwd)"\033[0m"
git fetch origin master && git reset --hard origin/master && git pull origin master
git checkout master
echo -e "\033[95m[git]\033[0m Pulled master."
# set version
VERSION=v$(npm pkg get version | tr -d '"')

APPS=("www" "blog" "wallpaper" "jigsaw" "game")
for APP_NAME in "${APPS[@]}"; do
  PM2_APP_NAME="${APP_NAME}.ifuyun.com"
  ZIP_FILENAME="release_${APP_NAME}_${VERSION}.zip"
  # stop server
  echo -e "\033[95m[server]\033[0m Stopping \033[36m${PM2_APP_NAME}\033[0m..."
  pm2 stop $PM2_APP_NAME -s
  echo -e "\033[95m[server]\033[0m \033[36m${PM2_APP_NAME}\033[0m is stopped."
  # unzip file
  echo -e "\033[95m[unzip]\033[0m Unzipping \033[36m${ZIP_FILENAME}\033[0m..."
  unzip -q $ZIP_FILENAME -d release/$APP_NAME
  rm -rf dist/$APP_NAME
  mv release/$APP_NAME dist/$APP_NAME
  rm -f $ZIP_FILENAME
  echo -e "\033[95m[unzip]\033[0m Unzipped \033[36m${ZIP_FILENAME}\033[0m."
  # restart server
  echo -e "\033[95m[server]\033[0m Restarting \033[36m${PM2_APP_NAME}\033[0m..."
  pm2 restart $PM2_APP_NAME
  echo -e "\033[95m[server]\033[0m \033[36m${PM2_APP_NAME}\033[0m is online."
done

echo -e "All done. ^_-"

exit 0