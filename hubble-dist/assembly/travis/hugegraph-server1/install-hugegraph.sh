#!/bin/bash

set -ev

SERVER_CONFIG_DIR=$(dirname "$0")
SERVER_PARENT_DIR="hugegraph-server1"
SERVER_DIR=${SERVER_PARENT_DIR}/hugegraph-*

echo $SERVER_CONFIG_DIR
echo $SERVER_PARENT_DIR
echo $SERVER_DIR

mkdir ${SERVER_PARENT_DIR}
tar -zxvf hugegraph-*.tar.gz -C "${SERVER_PARENT_DIR}" >/dev/null 2>&1

ls ./* && echo "###"
ls ./*/*

cp "${SERVER_CONFIG_DIR}"/gremlin-server.yaml "${SERVER_DIR}"/conf
cp "${SERVER_CONFIG_DIR}"/rest-server.properties "${SERVER_DIR}"/conf
cp "${SERVER_CONFIG_DIR}"/graphs/hugegraph1.properties "${SERVER_DIR}"/conf/graphs/
cp "${SERVER_CONFIG_DIR}"/graphs/hugegraph2.properties "${SERVER_DIR}"/conf/graphs/

cd "${SERVER_DIR}"

bin/init-store.sh || exit 1
bin/start-hugegraph.sh || exit 1
