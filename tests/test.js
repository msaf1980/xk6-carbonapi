import { CarbonapiQuery } from "k6/x/carbonapi";

export let options = {
    vus: 6,
    iterations: 12,
}

let carbonapiQuery = new CarbonapiQuery("tests/carbonapi.txt", "http://127.0.0.1:8080");
let render = carbonapiQuery.render().
    addIntervalGroup("default", 3600, 0);

export default function() {
    console.log("vu=" + __VU, "iter="+__ITER, render.nextGetJSON("default"));
}
