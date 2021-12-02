import http from 'k6/http';
import { check, sleep } from 'k6';

import carbonapi from "k6/x/carbonapi";
import getenv from "k6/x/getenv";

import { randomInt, getIntOrdered2 } from './utils.js'

let ADDR = getenv.getString(`${__ENV.ADDR}`, "http://127.0.0.1:8888");
let QUERIES = getenv.getString(`${__ENV.QUERIES}`, "carbonapi.txt");

let DELAY = getIntOrdered2(`${__ENV.DELAY}`, 10); // 1 request per 10s for user
let DURATION = getenv.getString(`${__ENV.DURATION}`, "60s"); // test duration

let USERS_1H_0 = getenv.getInt(`${__ENV.USERS_1H_0}`, 10);
let USERS_1H_7D = getenv.getInt(`${__ENV.USERS_1H_7D}`, 0);
let USERS_1D_0 = getenv.getInt(`${__ENV.USERS_1D_0}`, 0);
let USERS_1D_7D = getenv.getInt(`${__ENV.USERS_1D_7D}`, 0);
let USERS_7D_0 = getenv.getInt(`${__ENV.USERS_7D_0}`, 0);
let USERS_7D_10M = getenv.getInt(`${__ENV.USERS_7D_10M}`, 0);
let USERS_30D_0 = getenv.getInt(`${__ENV.USERS_30D_0}`, 0);
let USERS_90D_0 = getenv.getInt(`${__ENV.USERS_90D_0}`, 0);
let USERS_365D_0 = getenv.getInt(`${__ENV.USERS_365D_0}`, 0);

let scenarios = {};

if (USERS_1H_0 > 0) {
    scenarios["render_1h_offset_0"] = {
        executor: 'constant-vus',
        exec: 'api_render',
        vus: USERS_1H_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_1h_offset_0' },
    }
}

if (USERS_1H_7D > 0) {
    scenarios["render_1h_offset_7d"] = {
        executor: 'constant-vus',
        exec: 'api_render',
        vus: USERS_1H_7D,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_1h_offset_7d' },
    }
}

if (USERS_1D_0 > 0) {
    scenarios["render_1d_offset_0"] = {
        executor: 'constant-vus',
        exec: 'api_render',
        vus: USERS_1D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_1d_offset_0' },
    }
}

if (USERS_1D_7D > 0) {
    scenarios["render_1d_offset_7d"] = {
        executor: 'constant-vus',
        exec: 'api_render',
        vus: USERS_1D_7D,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_1d_offset_7d' },
    }
}

if (USERS_7D_0 > 0) {
    scenarios["render_7d_offset_0"] = {
        executor: 'constant-vus',
        exec: 'api_render',
        vus: USERS_7D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_7d_offset_0' },
    }
}

if (USERS_7D_10M > 0) {
    scenarios["render_7d_offset_10m"] = {
        executor: 'constant-vus',
        exec: 'api_render',
        vus: USERS_7D_10M,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_7d_offset_10m' },
    }
}

if (USERS_30D_0 > 0) {
    scenarios["render_30d_offset_0"] = {
        executor: 'constant-vus',
        exec: 'api_render',
        vus: USERS_30D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_30d_offset_0' },
    }
}

if (USERS_90D_0 > 0) {
    scenarios["render_90d_offset_0"] = {
        executor: 'constant-vus',
        exec: 'api_render',
        vus: USERS_90D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_90d_offset_0' },
    }
}

if (USERS_365D_0 > 0) {
    scenarios["render_365d_offset_0"] = {
        executor: 'constant-vus',
        exec: 'api_render',
        vus: USERS_365D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_365d_offset_0' },
    }
}

export const options = {
    thresholds: {
        'http_req_failed{name:render_1h_offset_0}': [
            {
                threshold: 'rate<0.01', // http errors should be less than 1%
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{name:render_1h_offset_0}': [
            {
                threshold: 'p(95)<1000', // 95% of requests should be below 1000ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{name:render_1h_offset_7d}': [
            {
                threshold: 'p(95)<1000', // 95% of requests should be below 1000ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{name:render_1d_offset_0}': [
            {
                threshold: 'p(95)<2000', // 95% of requests should be below 1000ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{name:render_1d_offset_7d}': [
            {
                threshold: 'p(95)<2000', // 95% of requests should be below 1000ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{name:render_7d_offset_0}': [
            {
                threshold: 'p(95)<5000', // 95% of requests should be below 1000ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{name:render_7d_offset_10m}': [
            {
                threshold: 'p(95)<5000', // 95% of requests should be below 1000ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{name:render_30d_offset_0}': [
            {
                threshold: 'p(95)<10000', // 95% of requests should be below 1000ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{name:render_90d_offset_0}': [
            {
                threshold: 'p(95)<15000', // 95% of requests should be below 1000ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{name:render_365d_offset_0}': [
            {
                threshold: 'p(95)<20000', // 95% of requests should be below 1000ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_connecting': [
            {
                threshold: 'p(95)<200', // 95% of requests connection time should be below 200ms
                abortOnFail: true,
                delayAbortEval: '10s',
            },
        ],
    },
    scenarios: scenarios,
};

export function setup() {
    carbonapi.loadQueries(QUERIES, ADDR);
    carbonapi.renderAddIntervalGroup('render_1h_offset_0', 3600, 0);
    carbonapi.renderAddIntervalGroup('render_1h_offset_7d', 3600, 3600 * 24 * 7);
    carbonapi.renderAddIntervalGroup('render_1d_offset_0', 3600 * 24, 0);
    carbonapi.renderAddIntervalGroup('render_1d_offset_7d', 3600 * 24, 3600 * 24 * 7);
    carbonapi.renderAddIntervalGroup('render_7d_offset_0', 3600 * 24 * 7, 0);
    carbonapi.renderAddIntervalGroup('render_7d_offset_10m', 3600 * 24, 600);
    carbonapi.renderAddIntervalGroup('render_30d_offset_0', 3600 * 24 * 30, 0);
    carbonapi.renderAddIntervalGroup('render_90d_offset_0', 3600 * 24 * 90, 0);
    carbonapi.renderAddIntervalGroup('render_365d_offset_0', 3600 * 24 * 365, 0);
}

export function api_render() {
    let group = __ENV.GROUP
    let url = carbonapi.renderNextGetJSON(group)

    // console.log("GROUP="+group, "VU="+__VU, "ITER="+__ITER, "URL="+url)

    let resp = http.get(url, {
        tags: { name: group },
    });
    check(resp, {
        'success': (r) => r.status === 200,
    });

    if (DELAY > 0) {
        sleep(randomInt(DELAY[0], DELAY[1]));
    }
}
