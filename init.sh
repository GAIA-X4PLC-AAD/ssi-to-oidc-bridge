#!/bin/bash

policy_config="./vclogin/init_config/policies"
descriptors_config="./vclogin/init_config/input_descriptors"
mkdir -p "$policy_config"
mkdir -p "$descriptors_config"

create_policy_file() {
    scope=$1
    # Create empty JSON file
    filename="${policy_config}/${scope}.json"
    if [ ! -f "$filename" ]; then
        echo "Generating file: $filename"
        touch "$filename"
    else
        echo "File already exists: $filename"
    fi
}

# Read student information
echo "Enter scope values your application can request."
echo "Press Ctrl+D (Ctrl+Z on Windows) to finish input"
while IFS= read -r -p "Enter scope value: " scope; do
    create_policy_file "$scope"
done

echo "All JSON files created successfully under policy_config folder."
