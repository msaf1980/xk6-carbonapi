export function randomInt(min, max) { // min and max included
    if (min == max) {
        return min
    }
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function splitString2(content, delim) {
    let start = content.indexOf(delim);
    if (start === -1) {
        return [content, content];
    }

    let a = content.substring(0, start)
    let b = content.substring(start + 1)

    return [a, b];
}

export function splitIntOrdered2(content, defaultValue, delim = ':') {
    if (content == null || content.length == 0) {
        content = defaultValue;
    }

    let s = splitString2(content, delim)

    let min = parseInt(s[0])
    if (s[1].length == 0) {
        return [min, min]
    }
    let max = parseInt(s[1])

    if (min > max) {
        return [max, min]
    }

    return [min, max]
}

export function getString(content, defaultValue) {
    if (content == null || content.length == 0 || content == "undefined") {
        return defaultValue
    }
    return content
}

export function getInt(content, defaultValue) {
    if (content == null || content.length == 0 || content == "undefined") {
        return defaultValue
    }

    return parseInt(content)
}

export function getIntOrdered2(content, defaultValue, delim = ':') {
    if (content == null || content.length == 0 || content == "undefined") {
        content = defaultValue
    }

    return splitIntOrdered2(content, defaultValue, delim)
}

export function getEnvParams(text) {
    let map = new Map();
    let vs = text.split(" ");
    for (const s of vs) {
        let v = splitString2(s, "=");
        map.set(v[0], v[1])
    }
    return map;
}

export function extractEnvParams(map, key) {
    let v = map.get(key)
    map.delete(key)
    return v
}

export function dumpMap(map) {
    var obj = {}
    map.forEach(function(v, k){
        obj[k] = v
    })
    return JSON.stringify(obj)
}
