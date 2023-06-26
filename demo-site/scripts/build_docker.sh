#!/bin/bash
set -e

function main {
    initialize $@

    copy_local_directories

    build_docker_image

    remove_tmp_enforcer_directories
}

function initialize {
    source ./scripts/common.sh
    
    validate_and_set_args $@

    initialize_environment_variables
}

function is_deploy_tool_required {
    if [[ "$(is_cdn_enforcer $enforcer)" == "true" && $cdn_container_type != "origin" ]]; then
        echo "true"
    else
        echo "false"
    fi
}

function is_enforcer_required {
    if [[ "$(is_cdn_enforcer $enforcer)" == "true" && $cdn_container_type == "origin" ]]; then
        echo "false"
    else
        echo "true"
    fi
}

function initialize_environment_variables {
    echo "Initializing environment variables"
    use_env_or_config_value PX_APP_ID px_app_id true
    use_env_or_config_value PX_AUTH_TOKEN px_auth_token true
    use_env_or_config_value PX_COOKIE_SECRET px_cookie_secret true
    use_env_or_config_value DOCKER_ENFORCER_DIR docker_enforcer_dir

    if [[ "$(is_enforcer_required)" == "true" ]]; then
        use_env_or_config_value LOCAL_ENFORCER_DIR local_enforcer_dir true
        use_env_or_config_value LOCAL_CORE_ENFORCER_DIR local_core_enforcer_dir
    fi

    if [[ "$(is_deploy_tool_required)" == "true" ]]; then
        use_env_or_config_value LOCAL_DEPLOY_TOOL_DIR local_deploy_tool_dir true
    fi
}

function copy_local_directories {
    export COPY_LOCAL_ENFORCER=${COPY_LOCAL_ENFORCER:-true}
    export COPY_LOCAL_CORE_ENFORCER=${COPY_LOCAL_CORE_ENFORCER:-true}
    export COPY_LOCAL_DEPLOY_TOOL_DIR=${COPY_LOCAL_DEPLOY_TOOL_DIR:-true}

    if [[ -n "${LOCAL_ENFORCER_DIR}" && "${COPY_LOCAL_ENFORCER}" == "true" ]]; then
        copy_local_dir_to_server_directory LOCAL_ENFORCER_DIR
    fi

    if [[ -n "${LOCAL_CORE_ENFORCER_DIR}" && "${COPY_LOCAL_CORE_ENFORCER}" == "true" ]]; then
        copy_local_dir_to_server_directory LOCAL_CORE_ENFORCER_DIR
    fi

    if [[ -n "${LOCAL_DEPLOY_TOOL_DIR}" && "${COPY_LOCAL_DEPLOY_TOOL_DIR}" == "true" ]]; then
        copy_local_dir_to_server_directory LOCAL_DEPLOY_TOOL_DIR 
    fi
}

function copy_local_dir_to_server_directory {
    local env_var=$1
    local src_dir=${!env_var}
    local target_dir=$(basename $src_dir)
    echo "Copying $env_var $src_dir into ./$target_dir"
    if [[ -d $target_dir ]]; then
        rm -rf $target_dir
    fi
    rsync -r $src_dir/* $target_dir --exclude node_modules --exclude build --exclude dist --exclude bin
    tmp_dirs+=($target_dir)
    export $env_var=$target_dir
}

function build_docker_image {
    if [[ "$(is_cdn_enforcer $enforcer)" == "true" ]]; then
        build_cdn_enforcer_docker_image
    else
        build_enforcer_docker_image
    fi
}

function build_cdn_enforcer_docker_image {
    container_name=${CONTAINER_NAME:-sample-${enforcer}-${cdn_container_type}}
    container_tag=${CONTAINER_TAG:-latest}

    if [[ $cdn_container_type == "origin" ]]; then
        build_cdn_origin
    elif [[ $cdn_container_type == "test_endpoints" ]]; then
        build_cdn_test_endpoints
    elif [[ $cdn_container_type == "update_sample_site" ]]; then
        echo "Building docker image $container_name:$container_tag using local enforcer ${LOCAL_ENFORCER_DIR}"
        build_cdn_update_sample_site
    else
        echo "No known docker file for CDN enforcer $enforcer: $cdn_container_type"
    fi
}

function build_cdn_origin {
    echo "Building docker image $container_name:$container_tag"
    docker build -t $container_name:$container_tag -f ./templates/origin/Dockerfile \
        --build-arg ENFORCER_NAME=$enforcer \
        --build-arg PORT=${PORT} \
        .
}

function build_cdn_test_endpoints {
    echo "Building docker image $container_name:$container_tag using local enforcer ${LOCAL_ENFORCER_DIR}"
    docker build -t $container_name:$container_tag -f ./servers/$enforcer/$cdn_container_type/Dockerfile \
        --build-arg ENFORCER_NAME=$enforcer \
        --build-arg PORT=${PORT} \
        --build-arg LOCAL_ENFORCER_DIR=${LOCAL_ENFORCER_DIR} \
        --build-arg LOCAL_CORE_ENFORCER_DIR=${LOCAL_CORE_ENFORCER_DIR} \
        --build-arg LOCAL_DEPLOY_TOOL_DIR=${LOCAL_DEPLOY_TOOL_DIR} \
        --build-arg PX_APP_ID=${PX_APP_ID} \
        --build-arg PX_AUTH_TOKEN=${PX_AUTH_TOKEN} \
        --build-arg PX_COOKIE_SECRET=${PX_COOKIE_SECRET} \
        .
}

function build_cdn_update_sample_site {
    echo "NOT YET READY"
}

function build_enforcer_docker_image {
    container_name=${CONTAINER_NAME:-sample-${enforcer}}
    container_tag=${CONTAINER_TAG:-latest}

    echo "Building docker image $container_name:$container_tag using local enforcer ${LOCAL_ENFORCER_DIR}"

    docker build -t $container_name:$container_tag \
        --build-arg PX_APP_ID=${PX_APP_ID} \
        --build-arg PX_AUTH_TOKEN=${PX_AUTH_TOKEN} \
        --build-arg PX_COOKIE_SECRET=${PX_COOKIE_SECRET} \
        --build-arg ENABLE_TEST_ENDPOINTS=${ENABLE_TEST_ENDPOINTS:-true} \
        --build-arg LOCAL_ENFORCER_DIR=${LOCAL_ENFORCER_DIR} \
        --build-arg LOCAL_CORE_ENFORCER_DIR=${LOCAL_CORE_ENFORCER_DIR} \
        --build-arg DOCKER_ENFORCER_DIR=${DOCKER_ENFORCER_DIR} \
        -f servers/$enforcer/Dockerfile .
}

function remove_tmp_enforcer_directories {
    for tmp_dir in "${tmp_dirs[@]}"
    do
        echo "Removing ./$tmp_dir"
        rm -rf $tmp_dir
    done
}

main $@