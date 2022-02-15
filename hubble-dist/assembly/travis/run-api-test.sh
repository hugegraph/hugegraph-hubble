#!/bin/bash

set -ev

"$1"/install-hugegraph-hubble.sh
jps

pip install behave
behave hubble-be/src/test/python

"$1"/build-report.sh
