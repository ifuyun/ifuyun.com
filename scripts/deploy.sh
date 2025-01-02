#!/bin/bash
set -e

echo -e "\033[95m[deploy]\033[0m starting deployment..."

PM2_APP_NAME=ifuyun.com
SHELL_PATH=$(dirname $0)

cd $SHELL_PATH
cd ..
# stop server
echo -e "\033[95m[server]\033[0m stopping server..."
pm2 stop $PM2_APP_NAME -s
echo -e "\033[95m[server]\033[0m server: \033[36m${PM2_APP_NAME}\033[0m is stopped."
# pull master
echo -e "\033[95m[git]\033[0m pulling master..."
echo -e "\033[95m[git]\033[0m path: \033[36m"$(pwd)"\033[0m"
git fetch origin master && git reset --hard origin/master && git pull origin master
git checkout master
echo -e "\033[95m[git]\033[0m pulled master."
# pull release
if [ -d "./dist/.git" ]; then
  echo -e "\033[95m[git]\033[0m pulling release..."
  cd ./dist
  git fetch origin release
  git reset --hard origin/release
  git pull origin release --depth 1
else
  echo -e "\033[95m[git]\033[0m cloning release..."
  rm -rf ./dist
  mkdir -p dist
  git clone --depth 1 -b release git@github.com:ifuyun/ifuyun.com.git ./dist
fi
echo -e "\033[95m[git]\033[0m pulled release."
# restart server
echo -e "\033[95m[server]\033[0m restarting server..."
pm2 restart $PM2_APP_NAME
echo -e "\033[95m[server]\033[0m server: \033[36m${PM2_APP_NAME}\033[0m is online."

echo -e "\033[95m[deploy]\033[0m \033[32mAll done. ^_-\033[0m"
