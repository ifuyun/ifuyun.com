#!/bin/bash
set -e

SHELL_PATH=$(dirname $0)
VERSION=v$(npm pkg get version | tr -d '"')

cd $SHELL_PATH
cd ../dist

echo -e "\033[95m[build]\033[0m zipping..."
zip -q -FSr ../$VERSION.zip *
echo -e "\033[95m[build]\033[0m zipped, file: $VERSION.zip."
