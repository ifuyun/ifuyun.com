#!/bin/bash

SHELL_PATH=$(dirname $0)

cd $SHELL_PATH
cd ..

echo "[install] installing dependencies..."
npm install
echo "[install] done."
