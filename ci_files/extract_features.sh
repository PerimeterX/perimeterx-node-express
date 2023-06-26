#!/bin/bash

# Read JSON file as a one-liner string
json_file_path="../px_metadata.json"
json_string=$(cat "$json_file_path" | tr -d '\n' | tr -d ' ')

echo "$json_string"