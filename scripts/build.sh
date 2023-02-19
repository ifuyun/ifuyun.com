#!/bin/bash

SHELL_PATH=$(dirname $0)

cd $SHELL_PATH
cd ..

echo "[build] building..."
npm run build:prod
echo "[build] done."
