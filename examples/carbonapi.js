import encoding from 'k6/encoding';
import http from 'k6/http';
import { check, sleep } from 'k6';

import { Trend } from 'k6/metrics';

import carbonapi from "k6/x/carbonapi";
import getenv from "k6/x/getenv";

import { htmlReport } from "./k6-reporter.js"; //https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js
import { textSummary } from "./k6-summary.js"; // https://jslib.k6.io/k6-summary/0.0.1/index.js

import { randomInt, getIntOrdered2 } from './rutils.js'

let ADDR = getenv.getString(`${__ENV.ADDR}`, "http://127.0.0.1:8888");
let USER = getenv.getEnv("CARBONAPI_USER", "");
let PASSWORD = getenv.getEnv("CARBONAPI_PASSWORD", "");
let headers = {};
if (USER.length > 0 && PASSWORD.length > 0) {
    // authenticate using HTTP Basic Auth
    const encodedCredentials = encoding.b64encode(`${USER}:${PASSWORD}`);
    headers["Authorization"] = `Basic ${encodedCredentials}`;
}

let QUERIES = getenv.getString(`${__ENV.QUERIES}`, "carbonapi.txt");

let DELAY = getIntOrdered2(`${__ENV.DELAY}`, "8000:12000"); // 1 request per random  in range 8:12 s for user
let DURATION = getenv.getString(`${__ENV.DURATION}`, "60s"); // test duration

let RENDER_FORMAT = getenv.getString(`${__ENV.RENDER_FORMAT}`, "json");

let THRESHOLD_TIME_1H = getenv.getInt(`${__ENV.THRESHOLD_TIME_1H}`, 3000)
let USERS_1H_0 = getenv.getInt(`${__ENV.USERS_1H_0}`, 10);
let USERS_1H_7D = getenv.getInt(`${__ENV.USERS_1H_7D}`, 0);

let THRESHOLD_TIME_1D = getenv.getInt(`${__ENV.THRESHOLD_TIME_1D}`, 5000)
let USERS_1D_0 = getenv.getInt(`${__ENV.USERS_1D_0}`, 0);
let USERS_1D_7D = getenv.getInt(`${__ENV.USERS_1D_7D}`, 0);

let THRESHOLD_TIME_7D = getenv.getInt(`${__ENV.THRESHOLD_TIME_7D}`, 7000)
let USERS_7D_0 = getenv.getInt(`${__ENV.USERS_7D_0}`, 0);
let USERS_7D_10M = getenv.getInt(`${__ENV.USERS_7D_10M}`, 0);

let THRESHOLD_TIME_30D = getenv.getInt(`${__ENV.THRESHOLD_TIME_30D}`, 10000)
let USERS_30D_0 = getenv.getInt(`${__ENV.USERS_30D_0}`, 0);

let THRESHOLD_TIME_90D = getenv.getInt(`${__ENV.THRESHOLD_TIME_90D}`, 15000)
let USERS_90D_0 = getenv.getInt(`${__ENV.USERS_90D_0}`, 0);

let THRESHOLD_TIME_365D = getenv.getInt(`${__ENV.THRESHOLD_TIME_365D}`, 20000)
let USERS_365D_0 = getenv.getInt(`${__ENV.USERS_365D_0}`, 0);

let THRESHOLD_FAIL_PCNT = getenv.getInt(`${__ENV.THRESHOLD_FAIL_PCNT}`, 1) / 100.0

let httpSendBytesTrend = Trend("http_req_send_bytes");
let httpRecvBytesTrend = Trend("http_req_recv_bytes");
let scenarios = {};

if (USERS_1H_0 > 0) {
    scenarios["render_1h_offset_0"] = {
        executor: 'constant-vus',
        exec: 'api_render_get',
        vus: USERS_1H_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_1h_offset_0' },
    }
}

if (USERS_1H_7D > 0) {
    scenarios["render_1h_offset_7d"] = {
        executor: 'constant-vus',
        exec: 'api_render_get',
        vus: USERS_1H_7D,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_1h_offset_7d' },
    }
}

if (USERS_1D_0 > 0) {
    scenarios["render_1d_offset_0"] = {
        executor: 'constant-vus',
        exec: 'api_render_get',
        vus: USERS_1D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_1d_offset_0' },
    }
}

if (USERS_1D_7D > 0) {
    scenarios["render_1d_offset_7d"] = {
        executor: 'constant-vus',
        exec: 'api_render_get',
        vus: USERS_1D_7D,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_1d_offset_7d' },
    }
}

if (USERS_7D_0 > 0) {
    scenarios["render_7d_offset_0"] = {
        executor: 'constant-vus',
        exec: 'api_render_get',
        vus: USERS_7D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_7d_offset_0' },
    }
}

if (USERS_7D_10M > 0) {
    scenarios["render_7d_offset_10m"] = {
        executor: 'constant-vus',
        exec: 'api_render_get',
        vus: USERS_7D_10M,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_7d_offset_10m' },
    }
}

if (USERS_30D_0 > 0) {
    scenarios["render_30d_offset_0"] = {
        executor: 'constant-vus',
        exec: 'api_render_get',
        vus: USERS_30D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_30d_offset_0' },
    }
}

if (USERS_90D_0 > 0) {
    scenarios["render_90d_offset_0"] = {
        executor: 'constant-vus',
        exec: 'api_render_get',
        vus: USERS_90D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_90d_offset_0' },
    }
}

if (USERS_365D_0 > 0) {
    scenarios["render_365d_offset_0"] = {
        executor: 'constant-vus',
        exec: 'api_render_get',
        vus: USERS_365D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_365d_offset_0' },
    }
}

export const options = {
    thresholds: {
        'http_req_failed{label:render_1h_offset_0}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT}`, // http errors should be less than 1%
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{label:render_1h_offset_0}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_1H}`, // 95% of requests should be below THRESHOLD_TIME_1H ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{label:render_1h_offset_7d}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_1H}`, // 95% of requests should be below THRESHOLD_TIME_1H ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{label:render_1d_offset_0}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_1D}`, // 95% of requests should be below THRESHOLD_TIME_1D ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{label:render_1d_offset_7d}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_1D}`, // 95% of requests should be below THRESHOLD_TIME_1D ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{label:render_7d_offset_0}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_7D}`, // 95% of requests should be below THRESHOLD_TIME_7D
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{label:render_7d_offset_10m}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_7D}`, // 95% of requests should be below THRESHOLD_TIME_7D ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{label:render_30d_offset_0}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_30D}`, // 95% of requests should be below THRESHOLD_TIME_30D ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{label:render_90d_offset_0}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_90D}`, // 95% of requests should be below THRESHOLD_TIME_90D ms
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
        'http_req_duration{label:render_365d_offset_0}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_365D}`, // 95% of requests should be below THRESHOLD_TIME_365D ms
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
        // workaround for output status codes
        'http_req_duration{status:200}': ['max>=0'],
        'http_req_duration{status:400}': ['max>=0'],
        'http_req_duration{status:401}': ['max>=0'],
        'http_req_duration{status:403}': ['max>=0'],
        'http_req_duration{status:404}': ['max>=0'],
        'http_req_duration{status:429}': ['max>=0'],
        'http_req_duration{status:499}': ['max>=0'], // timeout
        'http_req_duration{status:500}': ['max>=0'],
        'http_req_duration{status:501}': ['max>=0'],
        'http_req_duration{status:502}': ['max>=0'],
        'http_req_duration{status:503}': ['max>=0'],
        'http_req_duration{status:504}': ['max>=0'],
    },
    scenarios: scenarios,
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)', 'p(99.9)', 'count'],
};

export function setup() {
    if (USER.length > 0 && PASSWORD.length == 0) {
        console.warn(`not enable basic auth, CARBONAPI_PASSWORD not passed`);
    } else if (USER.length == 0 && PASSWORD.length > 0) {
        console.warn(`not enable basic auth, CARBONAPI_USER not passed`);
    } else if (USER.length > 0 && PASSWORD.length > 0) {
        console.log(`enable basic auth with user ${USER}`);
    }

    console.log('started with delay ' + DELAY[0] + ':' + DELAY[1] + " ms");
    console.log('render format: ' + RENDER_FORMAT);
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

export function api_render_get() {
    if (DELAY[0] > 0) {
        sleep(randomInt(DELAY[0], DELAY[1]) / 1000);
    }

    let group = __ENV.GROUP
    let url = carbonapi.renderNextGet(group, RENDER_FORMAT, 0)

    // console.log("GROUP="+group, "VU="+__VU, "ITER="+__ITER, "URL="+url[0])

    let resp = http.get(url[0], {
        headers: headers,
        tags: { name: url[1], label: group },
    });
    check(resp, {
        'success': (r) => r.status === 200,
    });
    if (resp.status == 200) {
        httpSendBytesTrend.add(resp.request.body.length, { name: url[1], label: group })
        httpRecvBytesTrend.add(resp.body.length, { name: url[1], label: group })
    }
}

// This will export to HTML as filename "result.html" AND also stdout using the text summary

export function handleSummary(data) {
  return {
    "result.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
