#!/usr/bin/env bash
set -e
set -u

echo ">>> Removing Deno..."

echo ">>> Removing ~/.deno..."

rm -rf ~/.deno 

echo ">>! Done. PATH entries weren't removed (this is a TODO)."
