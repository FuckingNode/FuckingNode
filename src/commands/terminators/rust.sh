#!/usr/bin/env bash
set -e
set -u

echo ">>> Removing Rust via Rustup..."

rustup self uninstall

echo ">>! Done. Please restart your terminal to fully apply changes."
