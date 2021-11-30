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

