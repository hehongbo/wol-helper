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
    console.log(`[${timestamp()}]${category ? `[${category}]` : ""}${source ? `[${source}]` : ""} ${text}`);
}
