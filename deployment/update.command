#!/bin/bash

clear
set +v
path=$(cd ${0%/*} && pwd -P)
for f in $path/*.w2p
do
	echo "Installing $f..."
	rm -r $path/web2py.app/Contents/Resources/applications/init
	mkdir $path/web2py.app/Contents/Resources/applications/init
	tar zxvf $f -C $path/web2py.app/Contents/Resources/applications/init
	echo "Finished installing $f"
done
exit
