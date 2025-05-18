#!/bin/bash
set -e

echo -e "\033[95m[deploy]\033[0m Starting deployment..."

PM2_APP_NAME_WWW=www.ifuyun.com
PM2_APP_NAME_BLOG=blog.ifuyun.com
PM2_APP_NAME_WALLPAPER=wallpaper.ifuyun.com
PM2_APP_NAME_JIGSAW=jigsaw.ifuyun.com
PM2_APP_NAME_GAME=game.ifuyun.com
SHELL_PATH=$(dirname $0)

cd $SHELL_PATH
cd ..
# stop server
echo -e "\033[95m[server]\033[0m Stopping server..."
pm2 stop PM2_APP_NAME_WWW -s
echo -e "\033[95m[server]\033[0m Server: \033[36m${PM2_APP_NAME_WWW}\033[0m is stopped."
pm2 stop PM2_APP_NAME_BLOG -s
echo -e "\033[95m[server]\033[0m Server: \033[36m${PM2_APP_NAME_BLOG}\033[0m is stopped."
pm2 stop PM2_APP_NAME_WALLPAPER -s
echo -e "\033[95m[server]\033[0m Server: \033[36m${PM2_APP_NAME_WALLPAPER}\033[0m is stopped."
pm2 stop PM2_APP_NAME_JIGSAW -s
echo -e "\033[95m[server]\033[0m Server: \033[36m${PM2_APP_NAME_JIGSAW}\033[0m is stopped."
pm2 stop PM2_APP_NAME_GAME -s
echo -e "\033[95m[server]\033[0m Server: \033[36m${PM2_APP_NAME_GAME}\033[0m is stopped."
# pull master
echo -e "\033[95m[git]\033[0m Pulling from GitHub..."
echo -e "\033[95m[git]\033[0m Path: \033[36m"$(pwd)"\033[0m"
git fetch origin master && git reset --hard origin/master && git pull origin master
git checkout master
echo -e "\033[95m[git]\033[0m Pulled master."
# pull release
if [ -d "./dist/.git" ]; then
  echo -e "\033[95m[git]\033[0m Pulling release..."
  cd ./dist
  git fetch origin release
  git reset --hard origin/release
  git pull origin release --depth 1
else
  echo -e "\033[95m[git]\033[0m Cloning release..."
  rm -rf ./dist
  mkdir -p dist
  git clone --depth 1 -b release git@github.com:ifuyun/ifuyun.com.git ./dist
fi
echo -e "\033[95m[git]\033[0m Pulled release."
# restart server
echo -e "\033[95m[server]\033[0m Restarting server..."
pm2 restart PM2_APP_NAME_WWW
echo -e "\033[95m[server]\033[0m Server: \033[36m${PM2_APP_NAME_WWW}\033[0m is online."
pm2 restart PM2_APP_NAME_BLOG
echo -e "\033[95m[server]\033[0m Server: \033[36m${PM2_APP_NAME_BLOG}\033[0m is online."
pm2 restart PM2_APP_NAME_WALLPAPER
echo -e "\033[95m[server]\033[0m Server: \033[36m${PM2_APP_NAME_WALLPAPER}\033[0m is online."
pm2 restart PM2_APP_NAME_JIGSAW
echo -e "\033[95m[server]\033[0m Server: \033[36m${PM2_APP_NAME_JIGSAW}\033[0m is online."
pm2 restart PM2_APP_NAME_GAME
echo -e "\033[95m[server]\033[0m Server: \033[36m${PM2_APP_NAME_GAME}\033[0m is online."

echo -e "\033[95m[deploy]\033[0m \033[32mAll done. ^_-\033[0m"
