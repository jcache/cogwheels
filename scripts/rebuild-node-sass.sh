#!/usr/bin/env bash
# Fix node-sass until they release a stable

set -e

echo "Installing node-sass binaries manually. This may take a while."

gyp_bin=$(which node-gyp)

if [ ! -z $SKIP_NODE_SASS_RECOMPILE ]; then
	echo "Skipping node-sass recompile"
	exit 0
fi

if [ ! -x "${gyp_bin}" ]; then
	echo "Please install node-gyp globally, e.g."
	echo "    npm install -g node-gyp"
	exit 1
fi

cd node_modules

if [ -d node-sass ]; then
	echo "Removing current node-sass directory..."
	rm -rf node-sass > /dev/null
fi

echo "Cloning node-sass repository..."
git clone --recursive --quiet https://github.com/sass/node-sass.git > /dev/null 2>&1

cd node-sass

echo "Initializing node-sass submodules..."
git submodule update --init --recursive --quiet > /dev/null

echo "Installing node-sass dependencies..."
npm install > /dev/null

echo "Recompiling node-sass binary..."
"${gyp_bin}" rebuild > /dev/null

echo 'Done!'
