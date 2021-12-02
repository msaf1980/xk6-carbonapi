export function randomInt(min, max) { // min and max included
    if (min == max) {
        return min
    }
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function splitString2(content, delim) {
    let start = content.indexOf(delim);
    if (start === -1) {
        return [content, ""];
    }

    let a = content.substring(0, start)
    let b = content.substring(start + 1)

    return [a, b];
}

export function splitIntOrdered2(content, defaultValue, delim = ':') {
    if (content == null || content.length == 0) {
        return [defaultValue, defaultValue];
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

export function findBetween(content, left, right) {
    let start = content.indexOf(left);
    if (start === -1) {
        return '';
    }
    start += left.length;
    const end = content.indexOf(right, start);
    if (end === -1) {
        return '';
    }
    return content.substring(start, end);
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
        return [defaultValue, defaultValue];
    }

    return splitIntOrdered2(content, defaultValue, delim)
}
