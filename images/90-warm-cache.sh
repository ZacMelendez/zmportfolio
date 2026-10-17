#!/bin/sh
# Run by the nginx image's entrypoint before nginx starts; warm.sh waits for it.
/usr/local/bin/warm-images &
