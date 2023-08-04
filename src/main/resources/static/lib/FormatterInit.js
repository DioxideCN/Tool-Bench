(() => {
    document.addEventListener("DOMContentLoaded", () => {
        const rootScript = document.getElementById("formatter-init");
        if (rootScript === null) return;
        const container = document.createElement("div");
        const root = document.createElement("div");
        const shadowDOM = container.attachShadow?.({ mode: "open" }) || container;

        const x6enable = rootScript.attributes['data-x6-enable'].value === "true";
        const g2enable = rootScript.attributes['data-g2-enable'].value === "true";

        if (!x6enable && !g2enable) return;

        if (x6enable) {
            const styleEl = document.createElement("script");
            styleEl.setAttribute(
                "src",
                "/plugins/ToolBench/assets/static/lib/AntVX6Handler.js"
            );
            shadowDOM.appendChild(styleEl);
        }
        if (g2enable) {
            const styleEl = document.createElement("script");
            styleEl.setAttribute(
                "src",
                "/plugins/ToolBench/assets/static/lib/AntVG2Handler.js"
            );
            shadowDOM.appendChild(styleEl);
        }
        shadowDOM.appendChild(root);
        document.body.appendChild(container);
    });
})();

// 解析ToolBench自适应表达式
function parseExpression(expression, occupied) {
    if (expression === "${full}") {
        return occupied;
    }
    const match = expression.replaceAll("full", occupied).match(/^\$\{([<>=]{1,2}.+)\?(.+):(.+)}$/);
    if (match) {
        return eval(`occupied${match[1]} ? ${match[2]} : ${match[3]}`);
    }
    throw new Error(`Invalid expression "${expression}"`);
}
