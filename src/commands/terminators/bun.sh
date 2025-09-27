#!/usr/bin/env bash
set -e
set -u

echo ">>> Removing BunJS..."

echo ">>> Removing ~/.bun..."

rm -rf ~/.bun 

echo ">>! Done. PATH entries weren't removed (this is a TODO)."
