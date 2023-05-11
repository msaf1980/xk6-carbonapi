# xk6-carbonapi

This is a [k6](https://go.k6.io/k6) extension using the [xk6](https://github.com/grafana/xk6) system.

| ---------------------------------------------------------------------------------------------------------------------------- |

This projects implements query generator for [graphite API](https://graphite-api.readthedocs.io/en/latest/api.html)
|
| ---------------------------------------------------------------------------------------------------------------------------- |

## Build

To build a `k6` binary with this extension, first ensure you have the prerequisites:

- [gvm](https://github.com/moovweb/gvm)
- [Git](https://git-scm.com/)

Then, install [xk6](https://github.com/grafana/xk6) and build your custom k6 binary with the carbonapi extension:

1. Install `xk6`:
  ```shell
  $ go install go.k6.io/xk6/cmd/xk6@latest
  ```

2. Build the binary:
  ```shell
  $ make build
  ```

3. For run test cycle
  ```shell
  $ make
  ```

# example

Tune with env variables K6_STATSITE_ADDR, K6_CARBONAPI_PARAMS (conyains other variables, separated with spaces), CARBONAPI_USER,  CARBONAPI_PASSWORD
```

export K6_CARBONAPI_ADDR="http://carbonapi.test.local"
export K6_STATSITE_ADDR="http://127.0.0.1:8888"

export K6_CARBONAPI_PARAMS="RENDER_FORMAT=carbonapi_v3_pb DELAY=1 DURATION=1h USERS_1H_0=10"

Default values:

DELAY         : 8000:12000     # 1 request per random (in range 8:12 seconds) for user, can used random value in range, pass like MIN:MAX or fixed like DELAY (in ms)
DURATION      : "60s"  # test duration

USERS_1H_0    : 10   # Number of users with queries in 1 hour range
USERS_1H_7D   : 0    # Number of users with queries in 1 hour range with from offset with 7 days (disabled by default)
USERS_1D_0    : 0    # Number of users with queries in 1 day range (disabled by default)
USERS_1D_7D   : 0    # Number of users with queries in 1 day range with from offset with 7 days (disabled by default)
USERS_7D_0    : 0    # Number of users with queries in 7 days range (disabled by default)
USERS_7D_7D   : 0    # Number of users with queries in 7 days range with from offset with 7 days (disabled by default)
USERS_30D_0   : 0    # Number of users with queries in 30 days range (disabled by default)
USERS_30D_7D  : 0    # Number of users with queries in 30 days range with from offset with 7 days (disabled by default)
USERS_90D_0   : 0    # Number of users with queries in 90 days range (disabled by default)
USERS_90D_7D  : 0    # Number of users with queries in 90 days range with from offset with 7 days (disabled by default)
USERS_365D_0  : 0    # Number of users with queries in 365 days range (disabled by default)
USERS_365D_7D : 0    # Number of users with queries in 365 days range with from offset with 7 days (disabled by default)

USERS_FIND    : 0    # Number of users with queries for /metrics/find (disabled by default)
USERS_TAGS    : 0    # Number of users with queries for /tags/autoComplete (disabled by default)

Thresolds for autostop

THRESHOLD_TIME_1H    :  3000 # 95% of requests in groups USERS_1H_0, USERS_1H_7D should be below THRESHOLD_TIME_1H ms
THRESHOLD_TIME_1D    :  5000 # 95% of requests in groups USERS_1D_0, USERS_1D_7D should be below THRESHOLD_TIME_1D ms
THRESHOLD_TIME_7D    :  7000 # 95% of requests in groups USERS_7D_0, USERS_7D_10M should be below THRESHOLD_TIME_7D ms
THRESHOLD_TIME_30D   : 10000 # 95% of requests in group  USERS_30D_0 should be below THRESHOLD_TIME_30D ms
THRESHOLD_TIME_90D   : 15000 # 95% of requests in group  USERS_90D_0 should be below THRESHOLD_TIME_90D ms
THRESHOLD_TIME_365D  : 20000 # 95% of requests in group  USERS_365D_0 should be below THRESHOLD_TIME_365D ms

THRESHOLD_TIME_FIND  : 3000 # 95% of requests in group  USERS_FIND should be below THRESHOLD_TIME_FIND ms
THRESHOLD_TIME_TAGS  : 3000 # 95% of requests in group  USERS_TAGS should be below THRESHOLD_TIME_TAGS ms

THRESHOLD_FAIL_PCNT_1H         : 1 # 1% Failed requests maximum percent
THRESHOLD_FAIL_PCNT_1D         : 1 # 1% Failed requests maximum percent
THRESHOLD_FAIL_PCNT_7D         : 1 # 1% Failed requests maximum percent
THRESHOLD_FAIL_PCNT_30D        : 1 # 1% Failed requests maximum percent
THRESHOLD_FAIL_PCNT_90D        : 1 # 1% Failed requests maximum percent
THRESHOLD_FAIL_PCNT_365D       : 1 # 1% Failed requests maximum percent

THRESHOLD_403_PCNT_FIND       : 1 # 1% Failed requests maximum percent
THRESHOLD_403_PCNT_TAGS       : 1 # 1% Failed requests maximum percent

THRESHOLD_403_PCNT_1H         : 1 # 1% Failed requests maximum percent
THRESHOLD_403_PCNT_1D         : 1 # 1% Failed requests maximum percent
THRESHOLD_403_PCNT_7D         : 1 # 1% Failed requests maximum percent
THRESHOLD_403_PCNT_30D        : 1 # 1% Failed requests maximum percent
THRESHOLD_403_PCNT_90D        : 1 # 1% Failed requests maximum percent
THRESHOLD_403_PCNT_365D       : 1 # 1% Failed requests maximum percent

THRESHOLD_403_PCNT_FIND       : 1 # 1% Failed requests maximum percent
THRESHOLD_403_PCNT_TAGS       : 1 # 1% Failed requests maximum percent

THRESHOLD_TIME_CONNECT        : 200 # 95% of requests connection time must be < THRESHOLD_TIME_CONNECT ms

RENDER               : "render.txt"           # Test render targets
RENDER_FORMAT        : json                   # Render format: json, protobuf or carbonapi_pb_v2 (for graphite-clickhouse), carbonapi_pb_v3
```

Pass CARBONAPI_USER and CARBONAPI_PASSWORD, if basic auth is needed
 ```shell
$ export CARBONAPI_USER="username" CARBONAPI_PASSWORD="password"
  ```

For different statistic for each query group use statsite output (identifical with statsd, but tagged metrics not supported and some taggs can be appended to metric with K6_STATSITE_TAG_APPEND)

```shell
$
export K6_STATSITE_ADDR='graphite-relay:8125' K6_STATSITE_NAMESPACE="Graphite.loadtest.k6.carbonapi.staging."
export K6_STATSITE_BUFFER_SIZE=1000 K6_STATSITE_TAG_APPEND='label'
export K6_OUT="statsite,clickhouse=http://k6:k6@localhost:8123/default?dial_timeout=200ms&max_execution_time=60"

export K6_CARBONAPI_PARAMS="DELAY=1 DURATION=1h USERS_FIND=1 USERS_TAGS=1 USERS_1H_0=10 USERS_1D_0=1 USERS_7D_0=1 USERS_30D_0=1 USERS_90D_0=1 USERS_365D_0=1"
export K6_CARBONAPI_PARAMS="FIND=find.txt TAGS=tags.txt ${K6_CARBONAPI_PARAMS} THRESHOLD_TIME_7D=15000 THRESHOLD_TIME_30D=30000 
THRESHOLD_TIME_90D=40000 THRESHOLD_TIME_365D=50000"

export K6_OUT_CLICKHOUSE_TESTNAME="`rpm -q carbonapi`"
export K6_OUT_CLICKHOUSE_PARAMS="${K6_CARBONAPI_PARAMS}"

../k6 run carbonapi.js
```

For graphite-clickhouse testing (with render carbonapi_v3_pb format)

```shell
$
export K6_STATSITE_ADDR='graphite-relay:8125' K6_STATSITE_NAMESPACE="Graphite.loadtest.k6.graphite_clickhouse.staging."
export K6_STATSITE_BUFFER_SIZE=1000 K6_STATSITE_TAG_APPEND='label'
export K6_OUT="statsite,clickhouse=http://k6:k6@localhost:8123/default?dial_timeout=200ms&max_execution_time=60"

export K6_CARBONAPI_ADDR="http://localhost:9090"
export K6_CARBONAPI_PARAMS="RENDER_FORMAT=carbonapi_v3_pb FIND_FORMAT=carbonapi_v3_pb DELAY=1 DURATION=1h USERS_FIND=1 USERS_TAGS=1 USERS_1H_0=10 USERS_1D_0=1 USERS_7D_0=1 USERS_30D_0=1 USERS_90D_0=1 USERS_365D_0=1"
export K6_CARBONAPI_PARAMS="RENDER=render_gch.txt FIND=find.txt TAGS=tags.txt ${K6_CARBONAPI_PARAMS} THRESHOLD_TIME_7D=15000 THRESHOLD_TIME_30D=30000 THRESHOLD_TIME_90D=40000 THRESHOLD_TIME_365D=50000"

export K6_OUT_CLICKHOUSE_TESTNAME="`rpm -q graphite-clickhouse`"
export K6_OUT_CLICKHOUSE_PARAMS="${K6_CARBONAPI_PARAMS}"

../k6 run carbonapi.js
```


If you need store results in Clickhouse database (see https://github.com/msaf1980/xk6-output-clickhouse for details)
For example you can pass argumets 
```
--out "clickhouse=http://k6:k6@localhost:8123/default?dial_timeout=200ms&max_execution_time=60"
```
or env variable
```
K6_OUT="clickhouse=http://k6:k6@localhost:8123/default?dial_timeout=200ms&max_execution_time=60" 
```

For custom test name pass K6_CLICKHOUSE_TESTNAME env var, for example
```
K6_OUT_CLICKHOUSE_TESTNAME="`rpm -q graphite-clickhouse`"
```

If run in one terminals with  non-default and default  parameters, don't forget unset env vars (or all and set it again), like

```shell
$
unset K6_CARBONAPI_ADDR K6_CARBONAPI_PARAMS
unset K6_OUT_CLICKHOUSE_TESTNAME K6_OUT_CLICKHOUSE_PARAMS
unset K6_STATSITE_ADDR K6_STATSITE_NAMESPACE K6_STATSITE_BUFFER_SIZE
```
