#!/bin/bash
# Open a URL in the system default browser.
# Uses gtk-launch to bypass Flatpak sandbox issues that cause
# xdg-open to silently fall through to secondary handlers.
set -e

URL="$1"
if [ -z "$URL" ]; then
  echo "Usage: $0 <url>" >&2
  exit 1
fi

BROWSER_DESKTOP=$(xdg-settings get default-web-browser 2>/dev/null || echo "")

if [ -n "$BROWSER_DESKTOP" ] && command -v gtk-launch &>/dev/null; then
  gtk-launch "$BROWSER_DESKTOP" "$URL" 2>/dev/null &
else
  xdg-open "$URL" 2>/dev/null &
fi
