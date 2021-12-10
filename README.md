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
  $ xk6 build --with github.com/msaf1980/xk6-carbonapi@latest --with github.com/msaf1980/xk6-getenv@v0.0.3
  ```

# example

Tune with variables
```
ADDR          : "http://127.0.0.1:8888"
QUERIES       : "carbonapi.txt"           # Test dataset

DELAY         : 10     # 1 request per 10s for user, can used random value in range, pass like MIN:MAX
DURATION      : "60s"  # test duration

USERS_1H_0    : 10   # Number of users with queries in 1 hour range
USERS_1H_7D   : 0    # Number of users with queries in 1 hour range with from offset wth 7 days (disabled by default)
USERS_1D_0    : 0    # Number of users with queries in 1 day range (disabled by default)
USERS_1D_7D   : 0    # Number of users with queries in 1 day range with from offset wth 7 days (disabled by default)
USERS_7D_0    : 0    # Number of users with queries in 7 days range (disabled by default)
USERS_7D_10M  : 0    # Number of users with queries in 7 days range with from offset wth 10 minutes (disabled by default)
USERS_30D_0   : 0    # Number of users with queries in 30 days range (disabled by default)
USERS_90D_0   : 0    # Number of users with queries in 90 days range (disabled by default)
USERS_365D_0  : 0    # Number of users with queries in 365 days range (disabled by default)
```

Pass CARBONAPI_USER and CARBONAPI_PASSWORD, if basic auth is needed
 ```shell
$ export CARBONAPI_USER="username" CARBONAPI_PASSWORD="password"
  ```

 ```shell
$ K6_STATSD_ADDR='graphite-relay:8125' K6_STATSD_BUFFER_SIZE=1000 K6_STATSD_TAG_APPEND='label' K6_STATSD_NAMESPACE="DevOps.loadtest.k6.graphite.staging." ./k6 run -e ADDR="http://localhost:8889" -e USERS_7D_0=100 --out statsd examples/carbonapi.js
  ```


