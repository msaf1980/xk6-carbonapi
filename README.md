# xk6-carbonapi

This is a [k6](https://go.k6.io/k6) extension using the [xk6](https://github.com/grafana/xk6) system.

| :exclamation: This is a proof of concept, isn't supported by the k6 team, and may break in the future. USE AT YOUR OWN RISK! |
| ---------------------------------------------------------------------------------------------------------------------------- |

This projects implements query generator for [graphite API](https://graphite-api.readthedocs.io/en/latest/api.html)
|
| ---------------------------------------------------------------------------------------------------------------------------- |

Predominantly because of the above this is very unlikely to ever get in k6 in it's current form, so please don't open issues :D. 

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
  $ xk6 build --with github.com/msaf1980/xk6-carbonapi@latest --with github.com/msaf1980/xk6-getenv@v0.0.4 --with github.com/msaf1980/xk6-statsite@v0.0.3
  ```

# example

Tune with variables
```
ADDR          : "http://127.0.0.1:8888"
QUERIES       : "carbonapi.txt"           # Test dataset

DELAY         : 8000:12000     # 1 request per random (in range 8:12 seconds) for user, can used random value in range, pass like MIN:MAX or fixed like DELAY (in ms)
DURATION      : "60s"  # test duration

USERS_1H_0    : 10   # Number of users with queries in 1 hour range
USERS_1H_7D   : 0    # Number of users with queries in 1 hour range with from offset with 7 days (disabled by default)
USERS_1D_0    : 0    # Number of users with queries in 1 day range (disabled by default)
USERS_1D_7D   : 0    # Number of users with queries in 1 day range with from offset with 7 days (disabled by default)
USERS_7D_0    : 0    # Number of users with queries in 7 days range (disabled by default)
USERS_7D_10M  : 0    # Number of users with queries in 7 days range with from offset with 10 minutes (disabled by default)
USERS_30D_0   : 0    # Number of users with queries in 30 days range (disabled by default)
USERS_90D_0   : 0    # Number of users with queries in 90 days range (disabled by default)
USERS_365D_0  : 0    # Number of users with queries in 365 days range (disabled by default)

Thresolds for autostop

THRESHOLD_TIME_1H    :  3000 # 95% of requests in groups USERS_1H_0, USERS_1H_7D should be below THRESHOLD_TIME_1H ms
THRESHOLD_TIME_1D    :  5000 # 95% of requests in groups USERS_1D_0, USERS_1D_7D should be below THRESHOLD_TIME_1D ms
THRESHOLD_TIME_7D    :  7000 # 95% of requests in groups USERS_7D_0, USERS_7D_10M should be below THRESHOLD_TIME_7D ms
THRESHOLD_TIME_30D   : 10000 # 95% of requests in group  USERS_30D_0 should be below THRESHOLD_TIME_30D ms
THRESHOLD_TIME_90D   : 15000 # 95% of requests in group  USERS_90D_0 should be below THRESHOLD_TIME_90D ms
THRESHOLD_TIME_365D  : 20000 # 95% of requests in group  USERS_365D_0 should be below THRESHOLD_TIME_365D ms
```

Pass CARBONAPI_USER and CARBONAPI_PASSWORD, if basic auth is needed
 ```shell
$ export CARBONAPI_USER="username" CARBONAPI_PASSWORD="password"
  ```

For different statistic for each query group use statsite output (identifical with statsd, but tagged metrics not supported and some taggs can be appended to metric with K6_STATSITE_TAG_APPEND)

 ```shell
$ K6_STATSITE_ADDR='graphite-relay:8125' K6_STATSITE_BUFFER_SIZE=1000 K6_STATSITE_TAG_APPEND='label' K6_STATSITE_NAMESPACE="DevOps.loadtest.k6.graphite.staging." ./k6 run -e ADDR="http://localhost:8889" -e USERS_1H_0=300 -e USERS_1D_0=50 -e USERS_7D_0=5 -e USERS_30D_0=5 -e DELAY=1 -e DURATION=1h --out json=result.json.gz --out statsite carbonapi.js
  ```
  
For long duration tests with limited memory usage can be run sequent

```shell
$
export K6_STATSITE_ADDR='graphite-relay:8125' K6_STATSITE_BUFFER_SIZE=1000 K6_STATSITE_TAG_APPEND='label' K6_STATSITE_NAMESPACE="DevOps.loadtest.k6.graphite.staging." 
for i in `seq 1 24`; do 
echo "Execute step ${i}" ;
./k6 run -e ADDR="http://localhost:8889" -e USERS_1H_0=300 -e USERS_1D_0=50 -e USERS_7D_0=5 -e USERS_30D_0=5 -e DELAY=1 -e DURATION=1h --out json=result.json.gz --out statsite carbonapi.js ;
[ "$?" == "0" ] || break ;
done
  ```
