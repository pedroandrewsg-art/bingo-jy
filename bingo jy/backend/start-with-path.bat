@echo off
cd /d %~dp0
set "PATH=C:\Program Files\nodejs;%PATH%"
set "PORT=4500"
node server.js
