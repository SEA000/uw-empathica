#!/bin/bash

clear
set +v
path=$(cd ${0%/*} && pwd -P)

number=$(ps aux | grep web2py | grep -v grep | wc -l)

if [ $number -eq 0 ]; then
	echo "Starting web2py server...	"
	$path/web2py.app/Contents/MacOS/web2py -a '<recycle>' --no-banner -N &
	echo "Close this window to stop Empathica."
else
	echo "web2py server already running..."
	echo "You can close this window without stopping Empathica."
fi

sleep 2
open http://127.0.0.1:8000
exit
