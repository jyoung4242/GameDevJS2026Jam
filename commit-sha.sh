#!/bin/sh

shashort=$(git rev-parse --short HEAD)
sha=$(git rev-parse HEAD)

echo "$shashort $sha"

sed -i "s/commitRefShort/$shashort/g" index.html

sed -i "s/commitRef/$sha/g" index.html
