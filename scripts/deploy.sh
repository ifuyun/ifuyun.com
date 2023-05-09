#!/bin/bash

PM2_APP_NAME=ifuyun.com

SHELL_PATH=$(dirname $0)

echo -e "\033[95m[deploy]\033[0m starting deployment..."

sh ${SHELL_PATH}/fetch.sh
sh ${SHELL_PATH}/install.sh

echo -e "\033[95m[deploy]\033[0m stopping server..."
# -s –silent: hide all messages
# https://pm2.io/docs/runtime/reference/pm2-cli/
pm2 stop $PM2_APP_NAME -s
echo -e "\033[95m[deploy]\033[0m server: \033[36m${PM2_APP_NAME}\033[0m is stopped."

sh ${SHELL_PATH}/build.sh

echo -e "\033[95m[deploy]\033[0m restarting server..."
pm2 restart $PM2_APP_NAME
echo -e "\033[95m[deploy]\033[0m server: \033[36m${PM2_APP_NAME}\033[0m is online."

echo -e "\033[95m[deploy]\033[0m \033[32mAll done. ^_-\033[0m"
