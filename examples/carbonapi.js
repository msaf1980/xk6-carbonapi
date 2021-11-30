import http from 'k6/http';
import { check, sleep } from 'k6';

import { CarbonapiQuery } from "k6/x/carbonapi";
import getenv from "k6/x/getenv";

let ADDR = getenv.getString(`${__ENV.ADDR}`, "http://127.0.0.1:8888");
let PARAMS = getenv.getString(`${__ENV.PARAMS}`, "carbonapi.txt");
let DURATION = getenv.getString(`${__ENV.DURATION}`, "60s");
let USERS_1H = getenv.getInt(`${__ENV.USERS_1H}`, 10);
let DELAY = getenv.getInt(`${__ENV.DELAY}`, 10);

export const options = {
    scenarios: {
        render_1_hour_offset_0: {
            executor: 'constant-vus',
            exec: 'api_render',
            vus: USERS_1H,
            duration: DURATION,
            env: { GROUP: 'render_1_hour_offset_0' },
        },
        render_1_hour_offset_7d: {
            executor: 'constant-vus',
            exec: 'api_render',
            vus: USERS_1H,
            duration: DURATION,
            env: { GROUP: 'render_1_hour_offset_7d' },
        },
    },
  };

let carbonapiQuery = new CarbonapiQuery(PARAMS, ADDR);
let render = carbonapiQuery.render().
    addIntervalGroup('render_1_hour_offset_0', 3600, 0).
    addIntervalGroup('render_1_hour_offset_7d', 3600, 604800);

export function api_render() {
    let group = __ENV.GROUP
    let url = render.nextGetJSON(group)
    http.get(url);
    sleep(DELAY);
}
