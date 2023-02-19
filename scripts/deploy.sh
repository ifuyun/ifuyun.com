#!/bin/bash

PM2_APP_NAME=ifuyun.com

SHELL_PATH=$(dirname $0)

echo "[deploy] starting deployment..."

sh ${SHELL_PATH}/fetch.sh
sh ${SHELL_PATH}/install.sh

echo "[deploy] stopping server..."
# -s –silent: hide all messages
# https://pm2.io/docs/runtime/reference/pm2-cli/
pm2 stop $PM2_APP_NAME -s

sh ${SHELL_PATH}/build.sh

echo "[deploy] restarting server..."
pm2 restart $PM2_APP_NAME
echo "[deploy] server: ${PM2_APP_NAME} is online."

echo "[deploy] All done. ^_-"
