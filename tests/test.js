import { sleep } from "k6";
import carbonapi from "k6/x/carbonapi";

export let options = {
    vus: 2,
    iterations: 2,
}

export function setup() {
    carbonapi.loadQueries("tests/render.txt", "tests/find.txt", "tests/tags.txt", "http://127.0.0.1:8080");
    carbonapi.renderAddIntervalGroup("default", 3600, 0);
}

export default function() {
    // render
    let r = carbonapi.renderNextGet("default", "json", 0);
    console.log("JSON render iter="+__ITER, "vu=" + __VU, "url=" + r[0], "name=\"" + r[1] + "\"");
    let r_pb = carbonapi.renderNextPb_v3("default", "carbonapi_v3_pb", 0);
    console.log("PB_V3 remder iter="+__ITER, "vu=" + __VU, "url=" + r_pb[0], "name=\"" + r_pb[1], "\" pb_v3=" + carbonapi.decodeRenderReqPb_v3(r_pb[2]));

    // find
    let f = carbonapi.findNextGet("default", "json", 0);
    console.log("JSON find iter="+__ITER, "vu=" + __VU, "url=" + f[0], "name=\"" + f[1] + "\"");
    let f_pb = carbonapi.findNextPb_v3("default", "carbonapi_v3_pb", 0);
    console.log("PB_V3 find iter="+__ITER, "vu=" + __VU, "url=" + f_pb[0], "name=\"" + f_pb[1], "\" pb_v3=" + carbonapi.decodeFindReqPb_v3(f_pb[2]));

    // tags
    let t = carbonapi.tagsNextGet("default", "json", 0);
    console.log("JSON tags iter="+__ITER, "vu=" + __VU, "url=" + t[0], "name=\"" + t[1] + "\"");
}
