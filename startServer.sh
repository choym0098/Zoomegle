#!/bin/bash

for pid in "$(lsof -i:3000 | awk '{ print $2 }')"
	do
		kill -9 $pid
	done

npm start
