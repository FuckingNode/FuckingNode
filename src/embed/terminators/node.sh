#!/usr/bin/env bash
set -e
set -u

echo ">>> Removing Node.js from all known methods (if present)..."
echo "This will attempt to remove installations from apt, dnf, pacman, and homebrew."

# Debian/Ubuntu
if command -v apt >/dev/null 2>&1; then
    sudo apt-get remove --purge -y nodejs npm || true
    sudo apt-get autoremove -y || true
fi

# Fedora/RHEL
if command -v dnf >/dev/null 2>&1; then
    sudo dnf remove -y nodejs npm || true
fi

# Arch/Manjaro
if command -v pacman >/dev/null 2>&1; then
    sudo pacman -Rns --noconfirm nodejs npm || true
fi

# macOS Homebrew
if command -v brew >/dev/null 2>&1; then
    brew uninstall --force node || true
    brew uninstall --force npm || true
fi

echo ">>> Removing common Node.js and npm directories..."

rm -rf /usr/local/lib/node_modules \
       /usr/local/include/node \
       /usr/local/bin/node \
       /usr/local/bin/npm \
       /usr/local/bin/npx \
       /usr/lib/node_modules \
       ~/.npm \
       ~/.nvm \
       ~/.node-gyp \
       ~/node_modules \
       ~/.local/lib/node_modules \
       ~/.local/bin/node \
       ~/.local/bin/npm \
       ~/.local/bin/npx

echo ">>> Cleaning PATH from node/npm entries..."
echo "(*.fknode.bak backup files of .bashrc and alike files will be made)"

for file in ~/.bashrc ~/.zshrc ~/.profile; do
    if [ -f "$file" ]; then
        cp "$file" "$file.fknode.bak"
        sed -i.bak '/nodejs/d;/npm/d;/nvm/d' "$file"
    fi
done

echo ">>! Done. Please restart your terminal to fully apply changes."
