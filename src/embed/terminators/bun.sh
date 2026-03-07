#!/usr/bin/env bash
set -e
set -u

if ! command -v bun >/dev/null 2>&1 && [ ! -d "$HOME/.bun" ]; then
    echo ">>> Bun does not appear to be installed."
    exit 0
fi

echo ">>> Removing Bun..."

rm -rf "$HOME/.bun"

echo ">>> Removing Bun PATH entries..."

FILES=(
    "$HOME/.bashrc"
    "$HOME/.bash_profile"
    "$HOME/.profile"
    "$HOME/.zshrc"
    "$HOME/.zprofile"
    "$HOME/.config/fish/config.fish"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo ">>> Removing Bun PATH entry from $file"
        echo ">>| Just in case, a PATH backup will be made at $file.fkn_uninstall.bak."
        cat $file > $file.fkn_uninstall.bak

        # remove bun install lines
        sed -i '/BUN_INSTALL/d' "$file"
        sed -i '/\.bun\/bin/d' "$file"
    fi
done

echo ">>! Done."

# TODO:
# remove from npm or homebrew