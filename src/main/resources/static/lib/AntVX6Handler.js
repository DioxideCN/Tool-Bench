(function() {
    // 用来分隔不同的 X6.Graph 对象
    let regexGraph = /((?:const|let|var)?\s*[^=]*?=\s*new\s*X6.Graph[\s\S]*?}\)|;)([\s\S]*?)(?=(?:const|let|var)?\s*[^=]*?=\s*new\s*X6.Graph|$)/g;
    // 用来获取 container 的名称
    let regexContainer = /container: document.getElementById\('([^']*)'\),/;
    let elements = document.querySelectorAll('.prism.language-x6');
    elements.forEach(function(element) {
        let text = element.textContent;
        let newText = text.replace(regexGraph, function(match, graphStr, graphOps) {
            let matchContainer = regexContainer.exec(graphStr);
            if (matchContainer !== null) {
                let occupied = document.querySelector(`#${matchContainer[1]}`).parentNode.offsetWidth;
                const x6replacer = graphStr.replace(/\$\{(([<>=]{1,2}.+)\?(.+):(.+)|full)}/g, function(match) {
                    return parseExpression(match, occupied).toString();
                });
                // 返回处理后的 graph 对象和其对应的操作
                return x6replacer + graphOps;
            }
            return match; // 如果没有找到匹配项，则返回原字符串
        });
        eval(newText);
        element.parentNode.removeChild(element);
    })
})();

