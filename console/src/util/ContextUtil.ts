import type {SelectionPos} from "@toast-ui/editor/types/editor";
import type {Editor} from "@toast-ui/editor";

function isMapEqual(a: Map<any, any>, b: Map<any, any>): boolean {
    if (a.size !== b.size) return false;
    for (const [key, val] of a.entries()) {
        if (b.get(key) !== val) return false;
    }
    return true;
}

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
    onResize: (mdEditor: Element,
               ...callbacks: Function[]) => {
        window.addEventListener('resize', () => {
            callbacks.forEach(callback => {
                callback();
            })
        })
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.contentRect.width !== entry.target.clientWidth) {
                    callbacks.forEach(callback => {
                        callback();
                    })
                }
            }
        });
        resizeObserver.observe(mdEditor);
    },
    
    UseRegular: {
        createTable: (x: number, y: number, instance: Editor): boolean => {
            if (x > 0 && y > 0) {
                const [start] = instance.getSelection() as [number[], number[]];
                let tableMarkdown = start[1] === 1 ? '' : '\n';
                for (let col = 0; col < y; col++) {
                    tableMarkdown += '|  ';
                }
                tableMarkdown += '|\n';
                for (let col = 0; col < y; col++) {
                    tableMarkdown += '| --- ';
                }
                tableMarkdown += '|\n';
                // 生成表格主体
                for (let row = 0; row < x - 1; row++) {
                    for (let col = 0; col < y; col++) {
                        tableMarkdown += '|  ';
                    }
                    tableMarkdown += '|\n';
                }
                instance.replaceSelection(tableMarkdown);
                return true;
            }
            return false;
        },
        createLink: (alt: string, url: string, instance: Editor): boolean => {
            instance.replaceSelection(`[${alt}](${url})`);
            return true;
        },
        createImage: (alt: string, url: string, instance: Editor): boolean => {
            instance.replaceSelection(`![${alt}](${url})`);
            return true;
        },
        createEmoji: (emoji: string, instance: Editor): boolean => {
            if (emoji) {
                instance.replaceSelection(emoji);
                return true;
            }
            return false;
        },
        createLatex: (instance: Editor): boolean => {
            const [start] = instance.getSelection() as [number[], number[]];
            let latexMarkdown = (start[1] === 1 ? '' : '\n') + '$$latex\n\n$$';
            instance.replaceSelection(latexMarkdown);
            return true;
        },
    },
    
    Line: {
        /**
         * 计算选区文本的字符数量
         * @param selection 选中的文本内容
         */
        countSelect: (selection: string): number => {
            return selection.replace(/\s+/g, '').length;
        },
        /**
         * 计算当前内容区域的行数
         * @param mdEditor 编辑器对象
         * @param selection 选择器
         * @param prevIndexMap 上一次的空行补齐集合
         * @param oldLineCount 上一次的行数
         * @return oldLineCount 更新后的新的行数
         * @return prevIndexMap 更新后的新的空行补齐集合
         * @return newLineContainer 更新后的行号容器
         * @author DioxideCN
         */
        count: (mdEditor: Element,
                selection: SelectionPos,
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
            if (!isMapEqual(indexMap, prevIndexMap) || oldLineCount !== newLineCount) {
                // 行数发生变化：需要通知更新行容器
                newLineContainer = ContextUtil.Line.updateLine(newLineCount, selection, indexMap);
                prevIndexMap = indexMap;
                oldLineCount = newLineCount;
            } else {
                // 只发生光标的移动：以回调的方式只更新聚焦高亮的行
                const lineNumber: number = ContextUtil.Line.getHighlightLine(selection);
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
         * @param selection 选择器
         * @param markMap 被标记需要插入空行补齐的索引集合
         * @return fragment 返回新的行容器在外部对DOM进行更新
         * @author DioxideCN
         */
        updateLine: (val: number,
                     selection: SelectionPos,
                     markMap: Map<number, number>): DocumentFragment => {
            const fragment = document.createDocumentFragment();
            const highlightRowNum = ContextUtil.Line.getHighlightLine(selection);
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
            // 额外补偿8个空行
            for (let i = 1; i < 9; i++) {
                const indentItem = document.createElement("div");
                indentItem.classList.add("line-item", "indent-item")
                fragment.appendChild(indentItem);
            }
            return fragment;
        },
        /**
         * 获取需要高亮显示的行号
         * @param selection 选择器
         * @return number 返回高亮显示的行号
         * @author DioxideCN
         */
        getHighlightLine: (selection: SelectionPos): number => {
            // @ts-ignore
            return selection[1][0];
        },
    }
}
