#!/bin/bash

SHELL_PATH=$(dirname $0)

cd $SHELL_PATH
cd ..

echo "\033[95m[build]\033[0m building..."
npm run build
echo "\033[95m[build]\033[0m done."
