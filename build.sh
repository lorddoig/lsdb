#!/bin/bash

TSC_EXE=./node_modules/.bin/tsc

rm -rf dist/*
${TSC_EXE} -m commonjs -t ES5 --outDir dist/ lsdb.ts
mv dist/{lsdb,lsdb-browserify}.js
${TSC_EXE} -m amd -t ES5 --outDir dist/ lsdb.ts
mv dist/{lsdb,lsdb-amd}.js
