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
    console.log("iter="+__ITER, "vu=" + __VU, carbonapi.renderNextGetJSON("default", 0));
}
