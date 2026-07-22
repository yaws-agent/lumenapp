#!/bin/bash
# Launch lumen on a given view, screenshot, then kill. Usage: ./shotview.sh <view> <out.png>
VIEW="$1"; OUT="$2"
killall -q electron 2>/dev/null
sleep 0.3
DISPLAY=:99 /home/ubuntu/lumenapp/node_modules/.bin/electron \
  --no-sandbox --disable-gpu --disable-software-rasterizer \
  /home/ubuntu/lumenapp/src/main.js --view="$VIEW" >/tmp/lumen_shot.log 2>&1 &
E_PID=$!
sleep 2
DISPLAY=:99 import -window root "$OUT" && echo "shot $OUT $(stat -c%s "$OUT")"
kill -9 "$E_PID" 2>/dev/null
killall -q electron 2>/dev/null
