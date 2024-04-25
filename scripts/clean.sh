#!/bin/bash

# Find and remove all node_modules directories
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# remove next build
rm -rf 

# remove python virtual environment
rm -rf .venv

# remove all caches
rm -rf .pytest_cache
rm -rf .ruff_cache
rm -rf .sst