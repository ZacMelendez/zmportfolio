#!/bin/sh
# Fills the image cache with every width the site's srcsets can ask for, so
# visitors get a cache HIT instead of waiting on an encode. Runs once at
# container start and then daily (cached entries are just HITs, so repeat runs
# are cheap and pick up newly added originals).
#
# Requests go one at a time so live visitors still get transformimgs' workers.
# Keep WIDTHS in step with images/nginx.conf and IMAGE_WIDTHS in
# src/utils/image.ts.

WIDTHS="320 480 640 800 960 1280 1600 1920 2560"
ORIGINALS=/srv/images/originals
BASE=http://127.0.0.1:8080

# One Accept per cache key nginx.conf can produce for real browsers:
#   Chrome/Edge/Firefox -> avif+webp, Safari 17+ -> avif+jxl+webp, others -> source format.
ACCEPTS="image/avif,image/webp
image/avif,image/jxl,image/webp
*/*"

warm() {
  start=$(date +%s)
  # Same filename rule as the /img/ locations in nginx.conf.
  files=$(cd "$ORIGINALS" && find . -type f ! -path '*/.*' |
    sed 's|^\./||' | grep -iE '\.(jpe?g|png|webp|avif|gif|tiff?)$')
  for f in $files; do
    for w in $WIDTHS; do
      echo "$ACCEPTS" | while IFS= read -r accept; do
        wget -q -O /dev/null -T 60 --header "Accept: $accept" \
          "$BASE/img/$f/resize?size=$w" || echo "warm: failed $f @ ${w}w ($accept)"
      done
    done
  done
  echo "warm: done in $(( $(date +%s) - start ))s"
}

# Wait for nginx to accept connections.
until wget -q -O /dev/null "$BASE/healthz" 2>/dev/null; do sleep 1; done

while :; do
  warm
  sleep 86400
done
