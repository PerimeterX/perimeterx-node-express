#!/bin/bash
set -e

function main {
    source ./scripts/common.sh

    validate_and_set_args $@

    set_variables $@

    run_docker_container
}

function set_variables {
    if [[ "$(is_cdn_enforcer $enforcer)" == "true" ]]; then
        container_name=${CONTAINER_NAME:-sample-${enforcer}-${cdn_container_type}}
    else
        container_name=${CONTAINER_NAME:-sample-${enforcer}}
    fi

    container_tag=${CONTAINER_TAG:-latest}
    port=${PORT:-3000}

    if [[ "$2" == "mount" ]]; then
        should_mount=true
    fi
}

function run_docker_container {
    echo "Running $container_name:$container_tag"
    if [[ "$should_mount" == "true" ]]; then
        mount_and_run_docker
    else
        run_docker
    fi
}

function mount_and_run_docker {
    use_env_or_config_value LOCAL_ENFORCER_DIR local_enforcer_dir true
    use_env_or_config_value DOCKER_ENFORCER_DIR docker_enforcer_dir true
    use_env_or_config_value LOCAL_CORE_ENFORCER_DIR local_core_enforcer_dir false
    use_env_or_config_value DOCKER_CORE_ENFORCER_DIR docker_core_enforcer_dir false

    if [[ -n "$LOCAL_CORE_ENFORCER_DIR" || -n "$DOCKER_CORE_ENFORCER_DIR" ]]; then
        echo "mounting local enforcer dir ${LOCAL_ENFORCER_DIR} and local core enforcer dir ${LOCAL_CORE_ENFORCER_DIR}"
        docker run -it -p $port:$port \
            -v ${LOCAL_ENFORCER_DIR}:${DOCKER_ENFORCER_DIR} \
            -v ${LOCAL_CORE_ENFORCER_DIR}:${DOCKER_CORE_ENFORCER_DIR} \
            $container_name:$container_tag
    else
        echo "mounting local enforcer dir ${LOCAL_ENFORCER_DIR}"
        docker run -it -p $port:$port \
            -v ${LOCAL_ENFORCER_DIR}:${DOCKER_ENFORCER_DIR} \
            $container_name:$container_tag
    fi
}

function run_docker {
    docker run -it -p $port:$port $container_name:$container_tag
}

main $@