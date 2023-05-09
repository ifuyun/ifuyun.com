#!/bin/bash

SHELL_PATH=$(dirname $0)

cd $SHELL_PATH
cd ..

echo -e "\033[95m[fetch]\033[0m fetching..."
echo -e "\033[95m[fetch]\033[0m path: \033[36m"$(pwd)"\033[0m"
echo -e "\033[95m[fetch]\033[0m pulling from GitHub..."
git fetch --all && git reset --hard origin/master && git pull
git checkout master
echo -e "\033[95m[fetch]\033[0m done."
