const cDim = "\x1b[2m";
const cUnderscore = "\x1b[4m";
const cReset = "\x1b[0m";

function colorCodedCategory(category) {
    switch (category) {
        case "Critical":
            return "\x1b[31m"; // Red
        case "Warning":
            return "\x1b[33m"; // Yellow
        case "Access":
            return "\x1b[36m"; // Cyan
        case "Info":
            return "\x1b[32m\x1b[2m"; // Dark Magenta
    }
}

function timestamp() {
    let date = new Date();
    return `${
        date.getFullYear()
    }-${
        date.getMonth().toString().padStart(2, "0")
    }-${
        date.getDate().toString().padStart(2, "0")
    } ${
        date.getHours().toString().padStart(2, "0")
    }:${
        date.getMinutes().toString().padStart(2, "0")
    }:${
        date.getSeconds().toString().padStart(2, "0")
    }`;
}

export function log(text = "", category, source) {
    let output = "";
    output += `${cDim}[${timestamp()}]${cReset}`;
    if (category) {
        output += `${cDim}[${cReset}${colorCodedCategory(category)}${category}${cReset}${cDim}]${cReset}`;
    }
    output += ` ${category ? `${colorCodedCategory(category)}` : ""}${text}${cReset}`;
    if (source) {
        output += `${cDim} - ‹${cUnderscore}${source}${cReset}${cDim}›${cReset}`;
    }
    console.log(output);
}
