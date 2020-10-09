#!/bin/bash

sass ../src/scss/main.scss:client/css/main.min.css --style compressed
node transpiler.min.js ../src/ts/ ../src/rust ./out/ ../src/ts/network/network.ts $1 $2
echo "Cleaning build's ./data/..."
rm -Rf ./client/data/
rm -Rf ./out/data/
echo "Copying ../src/data to ./data/..."
cp -a ../src/data/. ./client/data/
cp -a ../src/data/. ./out/data/
cd ./client
echo "Webpack..."
webpack -p
cd ../
echo "Cleaning out..."
rm -Rf ./out