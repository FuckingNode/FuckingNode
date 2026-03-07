#!/usr/bin/env bash
set -e
set -u

echo ">>> Removing Deno..."

rm -rf ~/.deno 

echo ">>> Removing Deno PATH entries..."

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
        echo ">>> Removing Deno PATH entry from $file"
        echo ">>| Just in case, a PATH backup will be made at $file.fkn_uninstall.bak."
        cat $file > $file.fkn_uninstall.bak

        sed -i '/DENO_INSTALL/d' "$file"
    fi
done

echo ">>> Done."
