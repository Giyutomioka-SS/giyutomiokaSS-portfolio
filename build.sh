#!/bin/bash

mkdir -p dist

# Minify HTML
html-minifier-terser index.html \
  --collapse-whitespace \
  --remove-comments \
  --remove-optional-tags \
  --minify-css true \
  --minify-js true \
  -o dist/index.html

# Minify CSS
csso style.css --output dist/style.css

# Minify JS
terser app.js --compress --mangle -o dist/app.js

# Copy favicon
cp favicon.svg dist/favicon.svg

echo "Done — check /dist"
