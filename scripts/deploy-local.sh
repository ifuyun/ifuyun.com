#!/bin/bash
set -e

echo -e "\033[95m[deploy]\033[0m Starting deployment..."

APP_NAME=""

# Parse command line arguments
for arg in "$@"
do
  shift
  case "$arg" in
    --app=*)  APP_NAME="${arg#*=}" ;;
    *)        echo "Warning: Unrecognized argument: $arg" ;;
  esac
done

if [ -z "$APP_NAME" ]; then
  echo -e "\033[91mError: APP_NAME is not set. Please provide it using --app=<app_name>\033[0m"
  exit 1
fi

PM2_APP_NAME="${APP_NAME}.ifuyun.com"
SHELL_PATH=$(dirname $0)

cd $SHELL_PATH
cd ..
# pull code
echo -e "\033[95m[git]\033[0m Pulling from GitHub..."
echo -e "\033[95m[git]\033[0m Path: \033[36m"$(pwd)"\033[0m"
git fetch origin master && git reset --hard origin/master && git pull origin master
git checkout master
echo -e "\033[95m[git]\033[0m Pulled master."
# install dependencies
echo -e "\033[95m[install]\033[0m Installing dependencies..."
npm install
echo -e "\033[95m[install]\033[0m Installed."
# stop server
echo -e "\033[95m[server]\033[0m Stopping server..."
pm2 stop $PM2_APP_NAME -s
echo -e "\033[95m[server]\033[0m Server: \033[36m${PM2_APP_NAME}\033[0m is stopped."
# build
echo -e "\033[95m[build]\033[0m Building..."
npm run build:prod:$APP_NAME
echo -e "\033[95m[build]\033[0m Built."
# restart server
echo -e "\033[95m[server]\033[0m Restarting server..."
pm2 restart $PM2_APP_NAME
echo -e "\033[95m[server]\033[0m Server: \033[36m${PM2_APP_NAME}\033[0m is online."

echo -e "\033[95m[deploy]\033[0m \033[32mAll done. ^_-\033[0m"
