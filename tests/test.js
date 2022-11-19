import { sleep } from "k6";
import carbonapi from "k6/x/carbonapi";

export let options = {
    vus: 6,
    iterations: 24,
}

export function setup() {
    carbonapi.loadQueries("tests/carbonapi.txt", "http://127.0.0.1:8080");
    carbonapi.renderAddIntervalGroup("default", 3600, 0);
}

export default function() {
    let t = carbonapi.renderNextGet("default", "json", 0);
    console.log("JSON iter="+__ITER, "vu=" + __VU, "url=" + t[0], "name=" + t[1]);
    let t_pb = carbonapi.renderNextPb_v3("default", "carbonapi_v3_pb", 0);
    console.log("PB_V3 iter="+__ITER, "vu=" + __VU, "url=" + t_pb[0], "name=" + t_pb[1], "pb_v3=" + carbonapi.decodeRenderReqPb_v3(t_pb[2]));
}
