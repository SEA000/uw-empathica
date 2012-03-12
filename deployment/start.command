#!/bin/bash

#clear
set +v
path=$(cd ${0%/*} && pwd -P)

# Kill the old server
instances=$(ps aux | grep web2py | grep -v grep | egrep -o '[A-Za-z] +[0-9]{3,5} +' | egrep -o '[0-9]+')
if [ -n "$instances" ]; then
	kill $instances &
	sleep 2
	wait
fi

# Attempt to update where relevant
files=$path/web2py.app/Contents/Resources/applications/init/uploads/*.w2p
val=$(echo $files | grep -o *.w2p)
if [ -z "$val" ]; then
	for f in $files;
	do
		cp $f $path/${f##*/}
		rm -r $path/web2py.app/Contents/Resources/applications/init
		mkdir $path/web2py.app/Contents/Resources/applications/init
		tar zxvf $path/${f##*/} -C $path/web2py.app/Contents/Resources/applications/init
		rm $path/${f##*/}
		break
	done
fi

# Start the web2py server
echo "Starting web2py server...	"
$path/web2py.app/Contents/MacOS/web2py -a '<recycle>' --no-banner -N &
echo "Close this window to stop Empathica."

sleep 2
open http://127.0.0.1:8000
wait
