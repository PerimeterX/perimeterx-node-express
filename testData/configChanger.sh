#!/bin/bash
​
siteUrl='' 

curl -X POST \
  "${siteUrl}/config" \
  -H 'Content-Type: application/json' \
  -d "$1"