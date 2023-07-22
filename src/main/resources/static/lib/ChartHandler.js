(function() {
    // 用来分隔不同的 G2.Chart 对象
    let regexChart = /((?:const|let|var)?\s*[^=]*?=\s*new\s*G2.Chart[\s\S]*?}\);)([\s\S]*?)(?=(?:const|let|var)?\s*[^=]*?=\s*new\s*G2.Chart|$)/g;
    // 用来获取 container 的名称
    let regExp = /container: '([^']*)',/;
    const elements = document.querySelectorAll('code.language-g2');
    elements.forEach(element => {
        let text = element.textContent;
        let newText = text.replace(regexChart, function(match, chartStr, chartOps) {
            let matchContainer = regExp.exec(chartStr);
            if (matchContainer !== null) {
                let occupied = document.getElementById(matchContainer[1]).parentNode.clientWidth;
                const g2replacer = chartStr.replace(/\$\{(\(.+\)\(.+\)|occupied)}/g, function(match) {return parseExpression(match, occupied).toString();});
                // 返回处理后的 chart 对象和其对应的操作
                return g2replacer + chartOps;
            }
            return match;  // 如果没有找到匹配项，则返回原字符串
        });
        eval(newText);
        element.parentNode.remove();
    });
})();