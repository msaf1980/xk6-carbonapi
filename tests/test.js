import { sleep } from "k6";
import carbonapi from "k6/x/carbonapi";

export let options = {
    vus: 6,
    iterations: 24,
}

export function setup() {
    carbonapi.loadQueries("tests/carbonapi.txt", "http://127.0.0.1:8080");
    carbonapi.renderAddIntervalGroup("default", 3600, 0)
}

export default function() {
    let t = carbonapi.renderNextGet("default", "json", 0)
    console.log("iter="+__ITER, "vu=" + __VU, "url=" + t[0], "name=" + t[1]);
}
