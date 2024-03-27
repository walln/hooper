#!/bin/bash

rye test -a
exit_code=$?

if [ $exit_code -eq 0 ] || [ $exit_code -eq 5 ]; then
    exit 0
else
    exit $exit_code
fi