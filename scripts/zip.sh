#!/bin/bash
set -e

APP_NAME=""

# Parse command line arguments
for arg in "$@"
do
  shift
  case "$arg" in
    --app=*)  APP_NAME="${arg#*=}" ;;
    *)        echo -e "\033[91mWarning: Unrecognized argument: $arg\033[0m" ;;
  esac
done

if [ -z "$APP_NAME" ]; then
  echo -e "\033[91mError: APP_NAME is not set. Please provide it using --app=<app_name>\033[0m"
  exit 1
fi

VERSION=v$(npm pkg get version | tr -d '"')
ZIP_FILENAME="release_${APP_NAME}_${VERSION}.zip"
SHELL_PATH=$(dirname $0)

cd $SHELL_PATH
cd ../dist/$APP_NAME

echo -e "\033[95m[build]\033[0m Zipping..."
zip -q -FSr ../../$ZIP_FILENAME *
echo -e "\033[95m[build]\033[0m Zipped, file: $ZIP_FILENAME."
