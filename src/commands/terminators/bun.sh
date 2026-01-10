#!/usr/bin/env bash
set -e
set -u

echo ">>> Removing Bun..."

echo ">>> Removing ~/.bun..."

rm -rf ~/.bun 

echo ">>! Done. PATH entries weren't removed (this is a TODO)."
