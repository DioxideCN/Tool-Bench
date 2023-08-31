export const ContextUtil = {
    countWord: (text: string) => {
        // 移除 Markdown 格式
        const plainText = text.replace(/\s+/g, '');
        const _characterCount = plainText.length;

        // 移除英文单词，剩下的字符按长度统计
        let _wordCount = (text.match(/\b[a-zA-Z]+\b/g) || []).length;
        const remainingText = text.replace(/\b[a-zA-Z]+\b/g, '');
        _wordCount += remainingText.replace(/\s+/g, '').length;

        return {
            _wordCount,
            _characterCount
        };
    },
    
    Line: {
        getContent: () => {
            
        },
        /**
         * 计算当前内容区域的行数
         * @param mdEditor 编辑器对象
         * @param prevIndexMap 上一次的空行补齐集合
         * @param oldLineCount 上一次的行数
         * @return oldLineCount 更新后的新的行数
         * @return prevIndexMap 更新后的新的空行补齐集合
         * @return newLineContainer 更新后的行号容器
         * @author DioxideCN
         */
        count: (mdEditor: Element,
                prevIndexMap: Map<number, number>,
                oldLineCount: number) => {
            const indexMap: Map<number, number> = new Map();
            // 当前行数
            const newLineCount: number = mdEditor.childNodes.length;
            // 插入行数块
            mdEditor.childNodes.forEach((childNode, index) => {
                // @ts-ignore
                const height = childNode.clientHeight || childNode.offsetHeight;
                const tempCounter = Math.ceil(height / 27);
                if (tempCounter > 1) {
                    indexMap.set(index, tempCounter - 1);
                }
            })
            // 声明容器
            let newLineContainer = null;
            if (JSON.stringify(Array.from(indexMap)) !== JSON.stringify(Array.from(prevIndexMap)) || oldLineCount !== newLineCount) {
                // 行数发生变化：需要通知更新行容器
                newLineContainer = ContextUtil.Line.updateLine(newLineCount, indexMap);
                prevIndexMap = indexMap;
                oldLineCount = newLineCount;
            } else {
                // 只发生光标的移动：以回调的方式只更新聚焦高亮的行
                const lineNumber: number = ContextUtil.Line.getHighlightLine();
                if (lineNumber !== -1) {
                    const divs = document.querySelectorAll('div[data-row]');
                    divs.forEach((div) => {
                        const dataRow: string = div.getAttribute('data-row')!;
                        if (dataRow === lineNumber.toString()) {
                            div.classList.add('line-highlight');
                        } else {
                            div.classList.remove('line-highlight');
                        }
                    });
                }
            }
            // 将更新后的IndexMap、LineCount、行容器返回
            return {
                prevIndexMap,
                oldLineCount,
                newLineContainer,
            };
        },
        /**
         * 当内容的行数发生变化时应当通知到这个方法更新行号容器
         * @param val 总行数
         * @param markMap 被标记需要插入空行补齐的索引集合
         * @return fragment 返回新的行容器在外部对DOM进行更新
         * @author DioxideCN
         */
        updateLine: (val: number,
                     markMap: Map<number, number>): DocumentFragment => {
            const fragment = document.createDocumentFragment();
            const highlightRowNum = ContextUtil.Line.getHighlightLine();
            for (let i = 0; i < val; i++) {
                const newLineItem = document.createElement("div");
                newLineItem.className = "line-item";
                newLineItem.dataset.row = (i + 1).toString();
                if (highlightRowNum === i + 1) { // 高亮聚焦的行
                    newLineItem.classList.add('line-highlight')
                }
                newLineItem.textContent = (i + 1).toString();
                fragment.appendChild(newLineItem);
                if (markMap.has(i)) {
                    const count = markMap.get(i)!;
                    for (let j = 0; j < count; j++) {
                        const indentLineItem = document.createElement("div");
                        indentLineItem.className = "line-item";
                        fragment.appendChild(indentLineItem);
                    }
                }
            }
            return fragment;
        },
        /**
         * 获取需要高亮显示的行号
         * @return number 返回高亮显示的行号
         * @author DioxideCN
         */
        getHighlightLine: (): number => {
            // 获取选择的文本DOM
            const selection = window.getSelection();
            if (!selection) return -1;
            let someNode = selection.anchorNode;
            if (!someNode) return -1;
            // @ts-ignore
            // 向上遍历DOM树，直到父DOM包含ProseMirror
            while (someNode && !someNode.parentNode?.classList?.contains('ProseMirror')) {
                someNode = someNode.parentNode;
            }
            if (!someNode) return -1;
            const parentNode = someNode.parentNode;
            if (!parentNode) return -1;
            // 将需要高亮的行号返回
            return Array.prototype.indexOf.call(parentNode.childNodes, someNode) + 1;
        },
    }
}
