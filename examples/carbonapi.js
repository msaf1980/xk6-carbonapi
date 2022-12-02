import encoding from 'k6/encoding';
import http from 'k6/http';
import { check, sleep, fail } from 'k6';

import { Trend, Rate } from 'k6/metrics';

import carbonapi from "k6/x/carbonapi";
import getenv from "k6/x/getenv";

import { htmlReport } from "./k6-reporter.js"; //https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js
import { textSummary } from "./k6-summary.js"; // https://jslib.k6.io/k6-summary/0.0.1/index.js

import { randomInt, getIntOrdered2, getEnvParams, extractEnvParams, dumpMap } from './rutils.js'

let ADDR = getenv.getEnv("K6_CARBONAPI_ADDR", "http://127.0.0.1:8888");
let USER = getenv.getEnv("CARBONAPI_USER", "");
let PASSWORD = getenv.getEnv("CARBONAPI_PASSWORD", "");
let headers = {};
if (USER.length > 0 && PASSWORD.length > 0) {
    // authenticate using HTTP Basic Auth
    const encodedCredentials = encoding.b64encode(`${USER}:${PASSWORD}`);
    headers["Authorization"] = `Basic ${encodedCredentials}`;
}

let K6_CARBONAPI_PARAMS=getEnvParams(getenv.getEnv("K6_CARBONAPI_PARAMS", ""))

let DELAY = getIntOrdered2(extractEnvParams(K6_CARBONAPI_PARAMS, "DELAY"), "8000:12000"); // 1 request per random  in range 8:12 s for user
let DURATION = getenv.getString(extractEnvParams(K6_CARBONAPI_PARAMS, "DURATION"), "60s"); // test duration

// /render
let RENDER = getenv.getString(extractEnvParams(K6_CARBONAPI_PARAMS, "RENDER"), "render.txt");
let RENDER_FORMAT = getenv.getString(extractEnvParams(K6_CARBONAPI_PARAMS, "RENDER_FORMAT"), "json");
let F_API_RENDER = 'api_render_get'
if (RENDER_FORMAT == 'carbonapi_v3_pb') {
    F_API_RENDER = 'api_render_pb_v3'
}

let THRESHOLD_TIME_1H = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_TIME_1H"), 3000)
let USERS_1H_0 = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_1H_0"), 10);
let USERS_1H_7D = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_1H_7D"), 0);

let THRESHOLD_TIME_1D = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_TIME_1D"), 5000)
let USERS_1D_0 = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_1D_0"), 0);
let USERS_1D_7D = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_1D_7D"), 0);

let THRESHOLD_TIME_7D = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_TIME_7D"), 7000)
let USERS_7D_0 = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_7D_0"), 0);
let USERS_7D_7D = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_7D_7D"), 0);

let THRESHOLD_TIME_30D = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_TIME_30D"), 10000)
let USERS_30D_0 = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_30D_0"), 0);
let USERS_30D_7D = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_30D_7D"), 0);

let THRESHOLD_TIME_90D = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_TIME_90D"), 15000)
let USERS_90D_0 = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_90D_0"), 0);
let USERS_90D_7D = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_90D_7D"), 0);

let THRESHOLD_TIME_365D = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_TIME_365D"), 20000)
let USERS_365D_0 = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_365D_0"), 0);
let USERS_365D_7D = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_365D_7D"), 0);

let THRESHOLD_FAIL_PCNT_1H = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_FAIL_PCNT_1H"), 1.0) / 100.0
let THRESHOLD_403_PCNT_1H = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_403_PCNT_1H"), 1.0) / 100.0
let THRESHOLD_FAIL_PCNT_1D = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_FAIL_PCNT_1D"), 1.0) / 100.0
let THRESHOLD_403_PCNT_1D = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_403_PCNT_1D"), 1.0) / 100.0
let THRESHOLD_FAIL_PCNT_7D = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_FAIL_PCNT_7D"), 1.0) / 100.0
let THRESHOLD_403_PCNT_7D = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_403_PCNT_7D"), 1.0) / 100.0
let THRESHOLD_FAIL_PCNT_30D = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_FAIL_PCNT_30D"), 1.0) / 100.0
let THRESHOLD_403_PCNT_30D = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_403_PCNT_30D"), 1.0) / 100.0
let THRESHOLD_FAIL_PCNT_90D = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_FAIL_PCNT_90D"), 1.0) / 100.0
let THRESHOLD_403_PCNT_90D = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_403_PCNT_90D"), 1.0) / 100.0
let THRESHOLD_FAIL_PCNT_365D = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_FAIL_PCNT_365D"), 1.0) / 100.0
let THRESHOLD_403_PCNT_365D = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_403_PCNT_365D"), 1.0) / 100.0

// /metrics/find
let FIND = getenv.getString(extractEnvParams(K6_CARBONAPI_PARAMS, "FIND"), "find.txt");
let FIND_FORMAT = getenv.getString(extractEnvParams(K6_CARBONAPI_PARAMS, "FIND_FORMAT"), "json");
let F_API_FIND = 'api_find_get'
if (FIND_FORMAT == 'carbonapi_v3_pb') {
    F_API_FIND = 'api_find_pb_v3'
}
let THRESHOLD_TIME_FIND = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_TIME_FIND"), 3000);
let USERS_FIND = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_FIND"), 0);
let THRESHOLD_FAIL_PCNT_FIND = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_FAIL_PCNT_FIND"), 1.0) / 100.0
let THRESHOLD_403_FIND_PCNT = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_403_FIND_PCNT"), 1.0) / 100.0

// /tags/autoComplete
let TAGS = getenv.getEnv(extractEnvParams(K6_CARBONAPI_PARAMS, "TAGS"), "tags.txt");
let F_API_TAGS = 'api_tags_get'
let THRESHOLD_TIME_TAGS = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_TIME_TAGS"), 3000);
let USERS_TAGS = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "USERS_TAGS"), 0);
let THRESHOLD_FAIL_PCNT_TAGS = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_FAIL_PCNT_TAGS"), 1.0) / 100.0
let THRESHOLD_403_TAGS_PCNT = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_403_TAGS_PCNT"), 1.0) / 100.0

let THRESHOLD_TIME_CONNECT = getenv.getInt(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_TIME_CONNECT"), 200)
// let THRESHOLD_ERROR_PCNT_NON_HTTP  = getenv.getFloat(extractEnvParams(K6_CARBONAPI_PARAMS, "THRESHOLD_ERROR_PCNT_NON_HTTP "), 1.0) / 100.0

// additional metrics
let httpSendBytesTrend = Trend("http_req_send_bytes");
let httpRecvBytesTrend = Trend("http_req_recv_bytes");
let httpReqNonHttpError = Rate("http_req_error_non_http");

let scenarios = {};

// find
if (USERS_FIND > 0 && FIND != "") {
    scenarios["find"] = {
        executor: 'constant-vus',
        exec: F_API_FIND,
        vus: USERS_FIND,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'find' },
    }
} else {
    FIND = ""
}

// tags
if (USERS_TAGS > 0 && TAGS != "") {
    scenarios["tags"] = {
        executor: 'constant-vus',
        exec: F_API_TAGS,
        vus: USERS_TAGS,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'tags' },
    }
} else {
    TAGS = ""
}

// render
if (USERS_1H_0 > 0) {
    scenarios["render_1h_offset_0"] = {
        executor: 'constant-vus',
        exec: F_API_RENDER,
        vus: USERS_1H_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_1h_offset_0' },
    }
}

if (USERS_1H_7D > 0) {
    scenarios["render_1h_offset_7d"] = {
        executor: 'constant-vus',
        exec: F_API_RENDER,
        vus: USERS_1H_7D,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_1h_offset_7d' },
    }
}

if (USERS_1D_0 > 0) {
    scenarios["render_1d_offset_0"] = {
        executor: 'constant-vus',
        exec: F_API_RENDER,
        vus: USERS_1D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_1d_offset_0' },
    }
}

if (USERS_1D_7D > 0) {
    scenarios["render_1d_offset_7d"] = {
        executor: 'constant-vus',
        exec: F_API_RENDER,
        vus: USERS_1D_7D,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_1d_offset_7d' },
    }
}

if (USERS_7D_0 > 0) {
    scenarios["render_7d_offset_0"] = {
        executor: 'constant-vus',
        exec: F_API_RENDER,
        vus: USERS_7D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_7d_offset_0' },
    }
}

if (USERS_7D_7D > 0) {
    scenarios["render_7d_offset_7d"] = {
        executor: 'constant-vus',
        exec: F_API_RENDER,
        vus: USERS_7D_7D,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_7d_offset_7d' },
    }
}

if (USERS_30D_0 > 0) {
    scenarios["render_30d_offset_0"] = {
        executor: 'constant-vus',
        exec: F_API_RENDER,
        vus: USERS_30D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_30d_offset_0' },
    }
}

if (USERS_30D_7D > 0) {
    scenarios["render_30d_offset_7d"] = {
        executor: 'constant-vus',
        exec: F_API_RENDER,
        vus: USERS_30D_7D,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_30d_offset_7d' },
    }
}

if (USERS_90D_0 > 0) {
    scenarios["render_90d_offset_0"] = {
        executor: 'constant-vus',
        exec: F_API_RENDER,
        vus: USERS_90D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_90d_offset_0' },
    }
}

if (USERS_90D_7D > 0) {
    scenarios["render_90d_offset_7d"] = {
        executor: 'constant-vus',
        exec: F_API_RENDER,
        vus: USERS_90D_7D,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_90d_offset_7d' },
    }
}

if (USERS_365D_0 > 0) {
    scenarios["render_365d_offset_0"] = {
        executor: 'constant-vus',
        exec: F_API_RENDER,
        vus: USERS_365D_0,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_365d_offset_0' },
    }
}

if (USERS_365D_7D > 0) {
    scenarios["render_365d_offset_7d"] = {
        executor: 'constant-vus',
        exec: F_API_RENDER,
        vus: USERS_365D_7D,
        duration: DURATION,
        gracefulStop: '10s',
        env: { GROUP: 'render_365d_offset_7d' },
    }
}

export const options = {
    thresholds: {
        'checks{status:fail, label:find}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_FIND}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:find}': [
            {
                threshold: `rate<${THRESHOLD_403_FIND_PCNT}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'http_req_duration{label:find}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_FIND}`, // 95% of requests should be below THRESHOLD_TIME_FIND ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:tags}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_TAGS}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:tags}': [
            {
                threshold: `rate<${THRESHOLD_403_TAGS_PCNT}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'http_req_duration{label:tags}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_TAGS}`, // 95% of requests should be below THRESHOLD_TIME_TAGS ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:render_1h_offset_0}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_1H}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:render_1h_offset_0}': [
            {
                threshold: `rate<${THRESHOLD_403_PCNT_1D}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'http_req_duration{label:render_1h_offset_0}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_1H}`, // 95% of requests should be below THRESHOLD_TIME_1H ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:render_1h_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_1H}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:render_1h_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_403_PCNT_1H}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],        
        'http_req_duration{label:render_1h_offset_7d}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_1H}`, // 95% of requests should be below THRESHOLD_TIME_1H ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:render_1d_offset_0}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_1D}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:render_1d_offset_0}': [
            {
                threshold: `rate<${THRESHOLD_403_PCNT_1D}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],        
        'http_req_duration{label:render_1d_offset_0}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_1D}`, // 95% of requests should be below THRESHOLD_TIME_1D ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:render_1d_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_1D}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:render_1d_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_403_PCNT_1D}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],        
        'http_req_duration{label:render_1d_offset_7d}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_1D}`, // 95% of requests should be below THRESHOLD_TIME_1D ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:render_7d_offset_0}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_7D}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:render_7d_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_403_PCNT_7D}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ], 
        'http_req_duration{label:render_7d_offset_0}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_7D}`, // 95% of requests should be below THRESHOLD_TIME_1D ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:render_7d_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_7D}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:render_7d_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_403_PCNT_7D}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ], 
        'http_req_duration{label:render_7d_offset_7d}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_7D}`, // 95% of requests should be below THRESHOLD_TIME_7D ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:render_30d_offset_0}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_30D}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:render_30d_offset_0}': [
            {
                threshold: `rate<${THRESHOLD_403_PCNT_30D}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ], 
        'http_req_duration{label:render_30d_offset_0}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_30D}`, // 95% of requests should be below THRESHOLD_TIME_30D ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:render_30d_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_30D}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:render_30d_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_403_PCNT_30D}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ], 
        'http_req_duration{label:render_30d_offset_7d}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_30D}`, // 95% of requests should be below THRESHOLD_TIME_30D ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:render_90d_offset_0}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_90D}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:render_90d_offset_0}': [
            {
                threshold: `rate<${THRESHOLD_403_PCNT_90D}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],        
        'http_req_duration{label:render_90d_offset_0}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_90D}`, // 95% of requests should be below THRESHOLD_TIME_90D ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:render_90d_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_90D}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:render_90d_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_403_PCNT_90D}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],        
        'http_req_duration{label:render_90d_offset_7d}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_90D}`, // 95% of requests should be below THRESHOLD_TIME_90D ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:render_365d_offset_0}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_365D}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:render_365d_offset_0}': [
            {
                threshold: `rate<${THRESHOLD_403_PCNT_365D}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'http_req_duration{label:render_365d_offset_0}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_365D}`, // 95% of requests should be below THRESHOLD_TIME_365D ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:fail, label:render_365d_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_FAIL_PCNT_365D}`, // http success should be greater or equal than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'checks{status:forbidden, label:render_365d_offset_7d}': [
            {
                threshold: `rate<${THRESHOLD_403_PCNT_365D}`, // http 403 errors should be less than
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'http_req_duration{label:render_365d_offset_7d}': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_365D}`, // 95% of requests should be below THRESHOLD_TIME_365D ms
                abortOnFail: true,
                delayAbortEval: '120s',
            },
        ],
        'http_req_connecting': [
            {
                threshold: `p(95)<${THRESHOLD_TIME_CONNECT}`, // 95% of requests connection time should be below 200ms
                abortOnFail: true,
                delayAbortEval: '10s',
            },
        ],
        // workaround for output status codes
        'http_req_duration{label:find, status:200}': ['max>=0'],
        'http_req_duration{label:find, status:400}': ['max>=0'],
        'http_req_duration{label:find, status:401}': ['max>=0'],
        'http_req_duration{label:find, status:forbidden}': ['max>=0'],
        'http_req_duration{label:find, status:404}': ['max>=0'],        
        'http_req_duration{label:find, status:500}': ['max>=0'],        
        'http_req_duration{label:find, status:501}': ['max>=0'],
        'http_req_duration{label:find, status:502}': ['max>=0'],
        'http_req_duration{label:find, status:503}': ['max>=0'],
        'http_req_duration{label:find, status:504}': ['max>=0'],
      
        'http_req_duration{label:tags, status:200}': ['max>=0'],
        'http_req_duration{label:tags, status:400}': ['max>=0'],
        'http_req_duration{label:tags, status:401}': ['max>=0'],
        'http_req_duration{label:tags, status:forbidden}': ['max>=0'],
        'http_req_duration{label:tags, status:404}': ['max>=0'],
        'http_req_duration{label:tags, status:500}': ['max>=0'],
        'http_req_duration{label:tags, status:501}': ['max>=0'],
        'http_req_duration{label:tags, status:502}': ['max>=0'],
        'http_req_duration{label:tags, status:503}': ['max>=0'],
        'http_req_duration{label:tags, status:504}': ['max>=0'],

        'http_req_duration{label:render_1h_offset_0, status:200}': ['max>=0'],                
        'http_req_duration{label:render_1h_offset_0, status:400}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_0, status:401}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_0, status:forbidden}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_0, status:404}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_0, status:500}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_0, status:501}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_0, status:502}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_0, status:503}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_0, status:504}': ['max>=0'],

        'http_req_duration{label:render_1h_offset_7d, status:200}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_7d, status:400}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_7d, status:401}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_7d, status:forbidden}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_7d, status:404}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_7d, status:500}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_7d, status:501}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_7d, status:502}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_7d, status:503}': ['max>=0'],
        'http_req_duration{label:render_1h_offset_7d, status:504}': ['max>=0'],

        'http_req_duration{label:render_1d_offset_0, status:200}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_0, status:400}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_0, status:401}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_0, status:forbidden}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_0, status:404}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_0, status:500}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_0, status:501}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_0, status:502}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_0, status:503}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_0, status:504}': ['max>=0'],

        'http_req_duration{label:render_1d_offset_7d, status:200}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_7d, status:400}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_7d, status:401}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_7d, status:forbidden}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_7d, status:404}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_7d, status:500}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_7d, status:501}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_7d, status:502}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_7d, status:503}': ['max>=0'],
        'http_req_duration{label:render_1d_offset_7d, status:504}': ['max>=0'],

        'http_req_duration{label:render_7d_offset_0, status:200}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_0, status:400}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_0, status:401}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_0, status:forbidden}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_0, status:404}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_0, status:500}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_0, status:501}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_0, status:502}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_0, status:503}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_0, status:504}': ['max>=0'],

        'http_req_duration{label:render_7d_offset_7d, status:200}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_7d, status:400}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_7d, status:401}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_7d, status:forbidden}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_7d, status:404}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_7d, status:500}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_7d, status:501}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_7d, status:502}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_7d, status:503}': ['max>=0'],
        'http_req_duration{label:render_7d_offset_7d, status:504}': ['max>=0'],

        'http_req_duration{label:render_30d_offset_0, status:200}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_0, status:400}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_0, status:401}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_0, status:forbidden}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_0, status:404}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_0, status:500}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_0, status:501}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_0, status:502}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_0, status:503}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_0, status:504}': ['max>=0'],

        'http_req_duration{label:render_30d_offset_7d, status:200}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_7d, status:400}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_7d, status:401}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_7d, status:forbidden}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_7d, status:404}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_7d, status:500}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_7d, status:501}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_7d, status:502}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_7d, status:503}': ['max>=0'],
        'http_req_duration{label:render_30d_offset_7d, status:504}': ['max>=0'],

        'http_req_duration{label:render_90d_offset_0, status:200}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_0, status:400}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_0, status:401}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_0, status:forbidden}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_0, status:404}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_0, status:500}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_0, status:501}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_0, status:502}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_0, status:503}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_0, status:504}': ['max>=0'],

        'http_req_duration{label:render_90d_offset_7d, status:200}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_7d, status:400}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_7d, status:401}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_7d, status:forbidden}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_7d, status:404}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_7d, status:500}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_7d, status:501}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_7d, status:502}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_7d, status:503}': ['max>=0'],
        'http_req_duration{label:render_90d_offset_7d, status:504}': ['max>=0'],

        'http_req_duration{label:render_365d_offset_0, status:200}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_0, status:400}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_0, status:401}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_0, status:forbidden}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_0, status:404}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_0, status:500}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_0, status:501}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_0, status:502}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_0, status:503}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_0, status:504}': ['max>=0'],

        'http_req_duration{label:render_365d_offset_7d, status:200}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_7d, status:400}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_7d, status:401}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_7d, status:forbidden}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_7d, status:404}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_7d, status:500}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_7d, status:501}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_7d, status:502}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_7d, status:503}': ['max>=0'],
        'http_req_duration{label:render_365d_offset_7d, status:504}': ['max>=0'],

        // 'http_req_duration{status:429, label:find}': ['max>=0'],
        // 'http_req_duration{status:499, label:find}': ['max>=0'], // timeout
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
    if (K6_CARBONAPI_PARAMS.size > 0) {
        fail('unknown parameters: ' + dumpMap(K6_CARBONAPI_PARAMS));
    }

    console.log('started with delay ' + DELAY[0] + ':' + DELAY[1] + " ms")
    console.log("thresholds success find " + THRESHOLD_FAIL_PCNT_FIND + ", tags " + THRESHOLD_FAIL_PCNT_TAGS + ", render 1h " + THRESHOLD_FAIL_PCNT_1H + ", 1d " + THRESHOLD_FAIL_PCNT_1D + ", 7d " + THRESHOLD_FAIL_PCNT_7D + ", 30d " + THRESHOLD_FAIL_PCNT_30D + ", 90d " + THRESHOLD_FAIL_PCNT_90D + ", 365d " + THRESHOLD_FAIL_PCNT_365D);
    console.log("thresholds 403 find " + THRESHOLD_403_FIND_PCNT + ", tags " + THRESHOLD_403_TAGS_PCNT + ", render 1h " + THRESHOLD_403_PCNT_1H + ", 1d " + THRESHOLD_403_PCNT_1D + ", 7d " + THRESHOLD_403_PCNT_7D + ", 30d " + THRESHOLD_403_PCNT_30D + ", 90d " + THRESHOLD_403_PCNT_90D + ", 365d " + THRESHOLD_403_PCNT_365D);    
    console.log("thresholds p95 ms find " + THRESHOLD_TIME_FIND + ", tags " + THRESHOLD_TIME_TAGS + ", render 1h " + THRESHOLD_TIME_1H + ", 1d " + THRESHOLD_TIME_1D + ", 7d " + THRESHOLD_TIME_7D + ", 30d " + THRESHOLD_TIME_30D + ", 90d " + THRESHOLD_TIME_90D + ", 365d " + THRESHOLD_TIME_365D);
    console.log('render format: ' + RENDER_FORMAT + '(' + RENDER + '), find format: ' + FIND_FORMAT  + '(' + FIND + '), tags (' + TAGS + ')');
    carbonapi.loadQueries(RENDER, FIND, TAGS, ADDR);
    let sizes = carbonapi.sizeQueries();
    console.log('load render targets ' + sizes[0] + ', find queries ' + sizes[1] + ', tags queries ' + sizes[2]);
    carbonapi.renderAddIntervalGroup('render_1h_offset_0', 3600, 0);
    carbonapi.renderAddIntervalGroup('render_1h_offset_7d', 3600, 3600 * 24 * 7);
    carbonapi.renderAddIntervalGroup('render_1d_offset_0', 3600 * 24, 0);
    carbonapi.renderAddIntervalGroup('render_1d_offset_7d', 3600 * 24, 3600 * 24 * 7);
    carbonapi.renderAddIntervalGroup('render_7d_offset_0', 3600 * 24 * 7, 0);
    carbonapi.renderAddIntervalGroup('render_7d_offset_7d', 3600 * 24, 600);
    carbonapi.renderAddIntervalGroup('render_30d_offset_0', 3600 * 24 * 30, 0);
    carbonapi.renderAddIntervalGroup('render_30d_offset_7d', 3600 * 24 * 30, 3600 * 24 * 7);
    carbonapi.renderAddIntervalGroup('render_90d_offset_0', 3600 * 24 * 90, 0);
    carbonapi.renderAddIntervalGroup('render_90d_offset_7d', 3600 * 24 * 90, 3600 * 24 * 7);
    carbonapi.renderAddIntervalGroup('render_365d_offset_0', 3600 * 24 * 365, 0);
    carbonapi.renderAddIntervalGroup('render_365d_offset_7d', 3600 * 24 * 365, 3600 * 24 * 7);
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
    let fail = check(resp, {
        'fail': (r) => { return !(r.status == 200 || r.status == 400 || r.status == 403 || r.status == 404) },
    }, { status: 'fail', label: group });
    check(resp, {
        'forbidden': (r) => { return r.status == 403 },
    }, { status: 'forbidden', label: group });
    if (resp.status == 200 || resp.status == 404) {
        httpSendBytesTrend.add(resp.request.body.length, { name: url[1], label: group })
        httpRecvBytesTrend.add(resp.body.length, { name: url[1], label: group })
    } else if (fail && (resp.error_code < 1400 || resp.error_code > 1599)) {
        httpReqNonHttpError.add(1)
    }
}

export function api_render_pb_v3() {
    if (DELAY[0] > 0) {
        sleep(randomInt(DELAY[0], DELAY[1]) / 1000);
    }

    let group = __ENV.GROUP
    let url = carbonapi.renderNextPb_v3(group, RENDER_FORMAT, 0)

    // console.log("GROUP="+group, "VU="+__VU, "ITER="+__ITER, "URL="+url[0])

    let resp = http.post(url[0], url[2], {
        headers: headers,
        tags: { name: url[1], label: group },
    });
    check(resp, {
        'fail': (r) => { return !(r.status == 200 || r.status == 400 || r.status == 403 || r.status == 404) },
    }, { status: 'fail', label: group });
    check(resp, {
        'forbidden': (r) => { return r.status == 403 },
    }, { status: 403, label: group });
    if (resp.status == 200 || resp.status == 404) {
        httpSendBytesTrend.add(resp.request.body.length, { name: url[1], label: group })
        httpRecvBytesTrend.add(resp.body.length, { name: url[1], label: group })
    } else if (fail && (resp.error_code < 1400 || resp.error_code > 1599)) {
        httpReqNonHttpError.add(1)        
    }
}

export function api_find_get() {
    if (DELAY[0] > 0) {
        sleep(randomInt(DELAY[0], DELAY[1]) / 1000);
    }

    let group = __ENV.GROUP
    let url = carbonapi.findNextGet(group, FIND_FORMAT, 0)

    // console.log("GROUP="+group, "VU="+__VU, "ITER="+__ITER, "URL="+url[0])

    let resp = http.get(url[0], {
        headers: headers,
        tags: { name: url[1], label: group },
    });
    check(resp, {
        'fail': (r) => { return !(r.status == 200 || r.status == 400 || r.status == 403 || r.status == 404) },
    }, { status: 'fail', label: group });
    check(resp, {
        'forbidden': (r) => { return r.status == 403 },
    }, { status: 403, label: group });
    if (resp.status == 200 || resp.status == 404) {
        httpSendBytesTrend.add(resp.request.body.length, { name: url[1], label: group })
        httpRecvBytesTrend.add(resp.body.length, { name: url[1], label: group })
    } else if (fail && (resp.error_code < 1400 || resp.error_code > 1599)) {
        httpReqNonHttpError.add(1)        
    }
}

export function api_find_pb_v3() {
    if (DELAY[0] > 0) {
        sleep(randomInt(DELAY[0], DELAY[1]) / 1000);
    }

    let group = __ENV.GROUP
    let url = carbonapi.findNextPb_v3(group, FIND_FORMAT, 0)

    // console.log("GROUP="+group, "VU="+__VU, "ITER="+__ITER, "URL="+url[0], url[1], "pb_v3=" + carbonapi.decodeFindReqPb_v3(url[2]))

    let resp = http.post(url[0], url[2], {
        headers: headers,
        tags: { name: url[1], label: group },
    });
    check(resp, {
        'fail': (r) => { return !(r.status == 200 || r.status == 400 || r.status == 403 || r.status == 404) },
    }, { status: 'fail', label: group });
    check(resp, {
        'forbidden': (r) => { return r.status == 403 },
    }, { status: 403, label: group });
    if (resp.status == 200 || resp.status == 404) {
        httpSendBytesTrend.add(resp.request.body.length, { name: url[1], label: group })
        httpRecvBytesTrend.add(resp.body.length, { name: url[1], label: group })
    } else if (fail && (resp.error_code < 1400 || resp.error_code > 1599)) {
        httpReqNonHttpError.add(1)        
    }
}

export function api_tags_get() {
    if (DELAY[0] > 0) {
        sleep(randomInt(DELAY[0], DELAY[1]) / 1000);
    }

    let group = __ENV.GROUP
    let url = carbonapi.tagsNextGet(group, 0)

    // console.log("GROUP="+group, "VU="+__VU, "ITER="+__ITER, "URL="+url[0])

    let resp = http.get(url[0], {
        headers: headers,
        tags: { name: url[1], label: group },
    });
    check(resp, {
        'fail': (r) => { return !(r.status == 200 || r.status == 400 || r.status == 403 || r.status == 404) },
    }, { status: 'fail', label: group });
    check(resp, {
        'forbidden': (r) => { return r.status == 403 },
    }, { status: 403, label: group });
    if (resp.status == 200 || resp.status == 404) {
        httpSendBytesTrend.add(resp.request.body.length, { name: url[1], label: group })
        httpRecvBytesTrend.add(resp.body.length, { name: url[1], label: group })
    } else if (fail && (resp.error_code < 1400 || resp.error_code > 1599)) {
        httpReqNonHttpError.add(1)        
    }
}

// This will export to HTML as filename "result.html" AND also stdout using the text summary

export function handleSummary(data) {
    return {
        "result.html": htmlReport(data),
        stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}
