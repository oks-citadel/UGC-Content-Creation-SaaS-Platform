#!/bin/bash
# =============================================================================
# NEXUS Platform - Wait for Service Script
# =============================================================================
# Wait for a service to be available before proceeding
# Based on: https://github.com/vishnubob/wait-for-it
# =============================================================================

set -e

TIMEOUT=15
QUIET=0
HOST=""
PORT=""

usage() {
    cat << USAGE >&2
Usage:
    $0 host:port [-t timeout] [-- command args]
    -h HOST | --host=HOST       Host or IP under test
    -p PORT | --port=PORT       TCP port under test
    -t TIMEOUT | --timeout=TIMEOUT
                                Timeout in seconds, zero for no timeout
    -q | --quiet                Don't output any status messages
    -- COMMAND ARGS             Execute command with args after the test finishes
USAGE
    exit 1
}

wait_for() {
    if [ $TIMEOUT -gt 0 ]; then
        echoerr "Waiting $TIMEOUT seconds for $HOST:$PORT"
    else
        echoerr "Waiting for $HOST:$PORT without a timeout"
    fi

    start_ts=$(date +%s)
    while :
    do
        if [ $TIMEOUT -gt 0 ]; then
            elapsed=$(($(date +%s) - start_ts))
            if [ $elapsed -gt $TIMEOUT ]; then
                echoerr "Timeout occurred after waiting $TIMEOUT seconds for $HOST:$PORT"
                exit 1
            fi
        fi

        (echo > /dev/tcp/$HOST/$PORT) >/dev/null 2>&1
        result=$?

        if [ $result -eq 0 ]; then
            end_ts=$(date +%s)
            echoerr "$HOST:$PORT is available after $((end_ts - start_ts)) seconds"
            break
        fi
        sleep 1
    done
    return $result
}

wait_for_wrapper() {
    # In order to support SIGINT during timeout: http://unix.stackexchange.com/a/57692
    if [ $QUIET -eq 1 ]; then
        timeout $TIMEOUT $0 --quiet --child --host=$HOST --port=$PORT --timeout=$TIMEOUT &
    else
        timeout $TIMEOUT $0 --child --host=$HOST --port=$PORT --timeout=$TIMEOUT &
    fi
    PID=$!
    trap "kill -INT -$PID" INT
    wait $PID
    RESULT=$?
    if [ $RESULT -ne 0 ]; then
        echoerr "Timeout occurred after waiting $TIMEOUT seconds for $HOST:$PORT"
    fi
    return $RESULT
}

echoerr() {
    if [ $QUIET -ne 1 ]; then echo "$@" 1>&2; fi
}

# Process arguments
while [ $# -gt 0 ]
do
    case "$1" in
        *:* )
        HOST=$(printf "%s\n" "$1"| cut -d : -f 1)
        PORT=$(printf "%s\n" "$1"| cut -d : -f 2)
        shift 1
        ;;
        -q | --quiet)
        QUIET=1
        shift 1
        ;;
        -h)
        HOST="$2"
        if [ "$HOST" == "" ]; then break; fi
        shift 2
        ;;
        --host=*)
        HOST="${1#*=}"
        shift 1
        ;;
        -p)
        PORT="$2"
        if [ "$PORT" == "" ]; then break; fi
        shift 2
        ;;
        --port=*)
        PORT="${1#*=}"
        shift 1
        ;;
        -t)
        TIMEOUT="$2"
        if [ "$TIMEOUT" == "" ]; then break; fi
        shift 2
        ;;
        --timeout=*)
        TIMEOUT="${1#*=}"
        shift 1
        ;;
        --child)
        CHILD=1
        shift 1
        ;;
        --)
        shift
        break
        ;;
        --help)
        usage
        ;;
        *)
        echoerr "Unknown argument: $1"
        usage
        ;;
    esac
done

if [ "$HOST" == "" ] || [ "$PORT" == "" ]; then
    echoerr "Error: you need to provide a host and port to test."
    usage
fi

wait_for

# Execute command if provided
if [ $# -gt 0 ]; then
    exec "$@"
fi
