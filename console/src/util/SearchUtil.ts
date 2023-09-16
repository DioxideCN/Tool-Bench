import type {Ref} from "vue";

export const SearchUtil = {
    /**
     * 从context中使用searchString内容进行搜索
     * @param context 上下文
     * @param search 搜索内容
     * @param sensitive 是否大小写敏感
     */
    text: (context: string, search: string, sensitive: boolean) => {
        if (context && search) {
            let total: number = 0;
            const markList: number[][] = [];
            // 根据sensitive决定是否转换为小写
            const targetContext: string = sensitive ? context : context.toLowerCase();
            const targetSearch: string = sensitive ? search : search.toLowerCase();
            const lines: string[] = targetContext.split('\n');
            lines.forEach((line: string, rowIndex: number): void => {
                let columnIndex: number = line.indexOf(targetSearch);
                while (columnIndex !== -1) {
                    total++;
                    markList.push([rowIndex + 1, columnIndex + 1]);
                    columnIndex = line.indexOf(targetSearch, columnIndex + targetSearch.length);
                }
            });
            return { total, markList };
        } else {
            return {};
        }
    },
    /**
     * 从context中使用searchRegex正则表达式进行搜索
     * @param context 上下文
     * @param search 搜索内容
     * @param sensitive 是否大小写敏感
     */
    regex: (context: string, search: string, sensitive: boolean) => {
        if (context && search) {
            let total: number = 0;
            const markList: number[][] = [];
            const regexFlags = sensitive ? 'gm' : 'gmi';
            let regex: RegExp;
            try {
                regex = new RegExp(search, regexFlags);
            } catch (error) {
                return {};
            }
            // @ts-ignore
            const matches = Array.from(context.matchAll(regex));
            matches.forEach(match => {
                total++;
                // @ts-ignore
                const startLine = context.substring(0, match.index).split('\n').length;
                // @ts-ignore
                const endLine = startLine + match[0].split('\n').length - 1;
                // @ts-ignore
                const startColumn = match.index - context.lastIndexOf('\n', match.index);
                // @ts-ignore
                const lastNewlineBeforeEnd = context.lastIndexOf('\n', match.index + match[0].length - 1);
                // @ts-ignore
                const endColumn = match.index + match[0].length - lastNewlineBeforeEnd;
                markList.push([startLine, startColumn, endLine, endColumn]);
            });
            return { total, markList };
        } else {
            return {};
        }
    },
    updateIt: (searchResult: Ref,
               searchCondition: Ref,
               total: number | undefined, 
               markList: number[][] | undefined,
               searchText: string) => {
        const amberContainer = document.getElementById("amber-highlight--group");
        if (!amberContainer) {
            return;
        }
        // 清空高亮
        amberContainer.innerHTML = "";
        if (total && markList) {
            searchResult.value.total = total;
            searchResult.value.hoverOn = 1;
            const editorArea = document.getElementsByClassName('ProseMirror')[0]!;
            const divs = Array.from(editorArea.children);
            if (searchCondition.value.regular) {
                // 正则数组 [[start_row, start_col, end_row, end_col]]
                markList.forEach(range => {
                    const [startRow, startCol, endRow, endCol] = range;
                    // 如果开始行和结束行是同一行
                    if (startRow === endRow) {
                        const div = divs[startRow - 1];
                        SearchUtil.renderHighlight(div, startCol, div, endCol);
                    } else {
                        // 处理开始行
                        let startDiv = divs[startRow - 1];
                        SearchUtil.renderHighlight(startDiv, startCol, startDiv, startDiv.innerHTML.length + 1);
                        // 处理结束行
                        let endDiv = divs[endRow - 1];
                        SearchUtil.renderHighlight(endDiv, 1, endDiv, endCol);
                    }
                });
            } else {
                // 全匹配数组 [[start_row, start_col]] -> += searching.length
                markList.forEach(range => {
                    const [startRow, startCol] = range;
                    const div = divs[startRow - 1]
                    SearchUtil.renderHighlight(div, startCol, div, startCol + searchText.length);
                })
            }
        } else {
            searchResult.value.total = 0;
            searchResult.value.hoverOn = 0;
        }
    },
    /**
     * 渲染搜索高亮层
     * @param startDom 起始DOM节点
     * @param startOffset 起始偏移量
     * @param endDom 结束DOM节点
     * @param endOffset 结束偏移量
     */
    renderHighlight: (startDom: Element, 
                      startOffset: number, 
                      endDom: Element, 
                      endOffset: number): void => {
        // 用于创建高亮元素
        const createHighlight = (top: number, left: number, width: number) => {
            const highlightDiv = document.createElement('div');
            highlightDiv.className = "amber-highlight--item";
            highlightDiv.style.top = top + 'px';
            highlightDiv.style.left = left + 'px';
            highlightDiv.style.width = width + 'px';
            return highlightDiv;
        };

        if (startDom && endDom) {
            const amberContainer = document.getElementById("amber-highlight--group");
            if (!amberContainer) return;

            const startContext = startDom.firstChild;
            const endContext = endDom.firstChild;
            if (!startContext || !endContext) return;

            const range = document.createRange();
            const editorRect = document.getElementsByClassName('toastui-editor md-mode')[0]!.getBoundingClientRect();

            let sliderStartOffset = startOffset - 1;
            let sliderEndOffset = startOffset;

            while (sliderEndOffset <= endOffset - 1) {
                range.setStart(startContext, sliderStartOffset);
                range.setEnd(startContext, sliderEndOffset);
                const rect = range.getBoundingClientRect();

                // 如果跨行
                if (rect.height > 27) {
                    const lastRange = document.createRange();
                    lastRange.setStart(startContext, sliderStartOffset);
                    lastRange.setEnd(startContext, sliderEndOffset - 1);
                    const lastRect = lastRange.getBoundingClientRect();
                    amberContainer.appendChild(
                        createHighlight(lastRect.top - editorRect.top - 3,
                            lastRect.left - editorRect.left,
                            lastRect.width)
                    );
                    // 滑动左端点到下一行
                    sliderStartOffset = sliderEndOffset - 1;
                }
                sliderEndOffset++;
            }

            // 为最后的部分创建高亮
            const finalRect = range.getBoundingClientRect();
            amberContainer.appendChild(
                createHighlight(finalRect.top - editorRect.top - 3,
                    finalRect.left - editorRect.left,
                    finalRect.width)
            );
        }
    }
}
