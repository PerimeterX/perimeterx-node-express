#!/bin/bash
set -e

shared_config_json_file=./shared_config.json
cdn_enforcers="fastly:cloudflare:lambda:akamai:fastly_js"
tmp_dirs=()

function is_cdn_enforcer {
    echo "$(contains $cdn_enforcers $1)"
}

function contains {
    [[ ":$1:" =~ ":$2:" ]] && echo "true" || echo "false"
}

function validate_and_set_args {
    if [[ -z $1 ]]; then
        echo "For which server?"
        read enforcer
    else
        enforcer=$1
    fi

    if [[ ! -d "./servers/$enforcer" ]]; then
        echo "No directory found for enforcer $enforcer, exiting..."
        exit 1
    fi

    config_json_file=./servers/$enforcer/config.json
    if [[ "$(is_cdn_enforcer $enforcer)" == "true" ]]; then
        if [[ -z $2 || $2 != "origin" && $2 != "test_endpoints" && $2 != "update_sample_site" ]]; then
            echo "origin, test_endpoints, or update_sample_site?"
            read cdn_container_type
        else
            cdn_container_type=$2
        fi

        if [[ ! -d "./servers/$enforcer/$cdn_container_type" ]]; then
            echo "No directory $cdn_container_type found for enforcer $enforcer, exiting..."
            exit 1
        fi
    fi
}

function get_value_from_config {
    desired_value=$1
    json_file=$2
    if [[ ! -f $json_file ]]; then
        echo ""
        return
    fi
    value=$(cat $json_file | grep $desired_value | cut -d ":" -f2 | tr -d '\ \," "')
    echo $value
}

function use_env_or_config_value {
    env_var=$1
    config_key=$2
    required=$3
    if [[ -z ${!env_var} ]]; then
        export $env_var="$(get_value_from_config $config_key $config_json_file)"
    fi

    if [[ -z ${!env_var} ]]; then
        export $env_var="$(get_value_from_config $config_key $shared_config_json_file)"
    fi

    if [[ "$required" == "true" && -z ${!env_var} ]]; then
        echo "Unable to initialize mandatory env variable ${env_var}!"
        exit 1
    fi
}