#!/bin/bash

clear
set +v
path=$(cd ${0%/*} && pwd -P)
rm -r $path/web2py.app/Contents/Resources/applications/init
for f in $path/*.w2p
do
	echo "Installing $f..."
	mkdir $path/web2py.app/Contents/Resources/applications/init
	tar zxvf $f -C $path/web2py.app/Contents/Resources/applications/init
	echo "Finished installing $f"
done
exit
