#!/bin/bash

SHELL_PATH=$(dirname $0)

cd $SHELL_PATH
cd ..

echo "\033[95m[install]\033[0m installing dependencies..."
npm install
echo "\033[95m[install]\033[0m done."
