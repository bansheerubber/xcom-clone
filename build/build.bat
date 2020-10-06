@echo off

sass ../src/scss/main.scss:client/css/main.min.css --style compressed && ^
node transpiler.min.js ../src/ts/ ../src/rust/ ./out/ %1 %2 && ^
cd ./client && ^
webpack -d && ^
cd ../