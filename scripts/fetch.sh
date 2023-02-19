#!/bin/bash

SHELL_PATH=$(dirname $0)

cd $SHELL_PATH
cd ..

echo "[fetch] fetching..."
echo "[fetch] path:" $(pwd)
echo "[fetch] pulling from GitHub..."
git fetch --all && git reset --hard origin/master && git pull
git checkout master
echo "[fetch] done."
