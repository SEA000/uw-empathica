@echo off
cd /d %~dp0

REM Check if the webservice is already running
tasklist /FI "IMAGENAME eq web2py_no_console.exe" 2> NUL | find /I /N "web2py_no_console.exe" > NUL 

REM If not, start it
if %ERRORLEVEL%==1 (
  echo "Starting web2py server..."
  start web2py_no_console.exe -a "<recycle>" --no-banner -N
)

timeout 3
start http://127.0.0.1:8000