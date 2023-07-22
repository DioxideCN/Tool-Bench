(() => {
    document.addEventListener("DOMContentLoaded", () => {
        const rootScript = document.getElementById("formatter-init");
        if (rootScript === null) return;
        const x6enable = rootScript.attributes['data-x6-enable'].value === "true";
        const g2enable = rootScript.attributes['data-g2-enable'].value === "true";

        if (!x6enable && !g2enable) return;

        const container = document.createElement("div");
        const root = document.createElement("div");
        const shadowDOM = container.attachShadow?.({ mode: "open" }) || container;
        if (x6enable) {
            const styleEl = document.createElement("script");
            styleEl.setAttribute(
                "src",
                "/plugins/ToolBench/assets/static/lib/GraphHandler.js"
            );
            shadowDOM.appendChild(styleEl);
        }
        if (g2enable) {
            const styleEl = document.createElement("script");
            styleEl.setAttribute(
                "src",
                "/plugins/ToolBench/assets/static/lib/ChartHandler.js"
            );
            shadowDOM.appendChild(styleEl);
        }
        shadowDOM.appendChild(root);
        document.body.appendChild(container);
    });
})();

function parseExpression(expression, occupied) {
    if (expression === "${occupied}") {
        return occupied;
    }

    const match = expression.match(/^\$\{\((<|>|<=|>=)(\d+):(.+)\)\((.+)\)}$/);

    if (match) {
        const operator = match[1];
        const threshold = Number(match[2]);
        const valueIfTrue = match[3] === "occupied" ? occupied : Number(match[3]);
        const valueIfFalse = match[4] === "occupied" ? occupied : Number(match[4]);

        if ((operator === "<" && this.offsetWidth < threshold) ||
            (operator === ">" && this.offsetWidth > threshold) ||
            (operator === "<=" && this.offsetWidth <= threshold) ||
            (operator === ">=" && this.offsetWidth >= threshold)) {
            return valueIfTrue;
        } else {
            return valueIfFalse;
        }
    }
    throw new Error(`wrong chart size expression "${expression}"`);
}
