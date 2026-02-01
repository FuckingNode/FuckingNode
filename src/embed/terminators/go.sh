#!/usr/bin/env bash
set -e
set -u

echo ">>> Removing Golang..."

echo ">>> Removing /usr/local/go..."

rm -rf /usr/local/go

echo ">>! Done. PATH entries weren't removed (this is a TODO)."
