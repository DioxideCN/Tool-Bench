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
    updateHighlight: (searchResult: {
                          total: number,
                          hoverOn: number,
                          list: number[] | number[][],
                      },
                      searchCondition: {
                          capitalization: boolean,
                          regular: boolean,
                      },
                      total: number | undefined,
                      markList: number[][] | undefined,
                      searchText: string): void => {
        const amberContainer: HTMLElement | null = document.getElementById("amber-highlight--group");
        if (!amberContainer) {
            return;
        }
        // 清空高亮
        amberContainer.innerHTML = "";
        if (total && markList) {
            searchResult.total = total;
            searchResult.hoverOn = 1;
            searchResult.list = markList;
            const editorArea: Element = document.getElementsByClassName('ProseMirror')[0]!;
            const divs = Array.from(editorArea.children);
            if (searchCondition.regular) {
                // 正则匹配 [[start_row, start_col, end_row, end_col]]
                markList.forEach((range: number[]): void => {
                    const [startRow, startCol, endRow, endCol]: number[] = range;
                    // 如果开始行和结束行是同一行
                    if (startRow === endRow) {
                        const div: Element = divs[startRow - 1];
                        SearchUtil.renderHighlight(div, startCol, endCol);
                    } else {
                        // 处理开始行
                        let startDiv: Element = divs[startRow - 1];
                        SearchUtil.renderHighlight(startDiv, startCol, startDiv.textContent!.length + 1);
                        // 处理结束行
                        let endDiv: Element = divs[endRow - 1];
                        SearchUtil.renderHighlight(endDiv, 1, endCol);
                    }
                });
            } else {
                // 纯文本匹配 [[start_row, start_col]] -> += searching.length
                markList.forEach(range => {
                    const [startRow, startCol] = range;
                    const div: Element = divs[startRow - 1]
                    SearchUtil.renderHighlight(div, startCol, startCol + searchText.length);
                })
            }
        } else {
            searchResult.total = 0;
            searchResult.hoverOn = 0;
        }
    },
    /**
     * 该方法需要传递需要高亮区域的信息
     * @param where 高亮区域的起始位置的DOM节点
     * @param startOffset 起始位置在DOM文本内容中的[索引+1]处开始
     * @param endOffset 结束位置在DOM文本内容中的[索引+1]处结束
     */
    renderHighlight: (where: Element, 
                      startOffset: number,
                      endOffset: number): void => {
        if (where) {
            const amberContainer: HTMLElement | null = document.getElementById("amber-highlight--group");
            if (!amberContainer) return;
            const raw = {
                elem: where,
                index: {
                    start: startOffset - 1,
                    end: endOffset - 1,
                },
            }
            const editorRect = document.getElementsByClassName('toastui-editor md-mode')[0]!.getBoundingClientRect();
            // 定义滑动窗口
            const slider: {left: number, right: number} = {
                left: raw.index.start,       // 左指针
                right: raw.index.start + 1,  // 右指针
            }
            let range: Range | null = createRangeFromOffsets(raw.elem, slider.left + 1, slider.right + 1);
            if (!range) return;
            // 窗口迭代
            while (slider.right !== raw.index.end) {
                const rect: DOMRect = range.getBoundingClientRect();
                // slider.right已经移动到了下一行
                if (rect.height > 27) {
                    const lastRange: Range | null = createRangeFromOffsets(raw.elem, slider.left + 1, slider.right);
                    if (!lastRange) return;
                    const lastRect: DOMRect = lastRange.getBoundingClientRect();
                    amberContainer.appendChild(createHighlight(lastRect.top - editorRect.top - 3, lastRect.left - editorRect.left, lastRect.width));
                    slider.left = slider.right - 1; // 将左指针也移动到下一行
                }
                slider.right++; // 指针推进
                range = createRangeFromOffsets(raw.elem, slider.left + 1, slider.right + 1);
                if (!range) return;
            }
            range = createRangeFromOffsets(raw.elem, slider.left + 1, slider.right + 1);
            if (!range) return;
            const tempRect: DOMRect = range.getBoundingClientRect();
            // 因为range在最后指针又向前移动了一个所以需要判断这个位置是否换行了
            if (tempRect.height > 27) {
                const lastRange: Range = createRangeFromOffsets(raw.elem, slider.left + 1, slider.right)!;
                // 创建上一个的高亮区
                const lastRect: DOMRect = lastRange.getBoundingClientRect();
                amberContainer.appendChild(createHighlight(lastRect.top - editorRect.top - 3, lastRect.left - editorRect.left, lastRect.width));
                slider.left = slider.right - 1; // 将左指针也移动到下一行
                range = createRangeFromOffsets(raw.elem, slider.left + 1, slider.right + 1)!;
                // 创建换行后的下一个高亮区
                const rect: DOMRect = range.getBoundingClientRect();
                amberContainer.appendChild(createHighlight(rect.top - editorRect.top - 3, rect.left - editorRect.left, rect.width));
            } else {
                const rect: DOMRect = range.getBoundingClientRect();
                amberContainer.appendChild(createHighlight(rect.top - editorRect.top - 3, rect.left - editorRect.left, rect.width));
            }
        }
    },
    highlightSelection: (startRow: number, 
                         startIdx: number, 
                         endRow: number, 
                         endIdx: number): Range | null => {
        const editorArea: Element = document.getElementsByClassName('ProseMirror')[0]!;
        const divs: Element[] = Array.from(editorArea.children);
        const startRange: Range | null = createRangeFromOffsets(divs[startRow - 1], startIdx, startIdx);
        const endRange: Range | null = createRangeFromOffsets(divs[endRow - 1], endIdx, endIdx);
        if (!startRange || !endRange) return null;
        const range: Range = document.createRange();
        range.setStart(startRange.commonAncestorContainer, startRange.startOffset);
        range.setEnd(endRange.commonAncestorContainer, endRange.endOffset);
        const selection: Selection | null = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
        return selection ? selection.getRangeAt(0) : null;
    },
}

function createRangeFromOffsets(div: Element, 
                                startOffset: number, 
                                endOffset: number): Range | null {
    startOffset -= 1;
    endOffset -= 1;
    if (div.nodeType === Node.ELEMENT_NODE && !div.childNodes.length && startOffset === 0 && endOffset === 0) {
        const range = document.createRange();
        range.setStart(div, 0);
        range.setEnd(div, 0);
        return range;
    }
    let currentOffset: number = 0, 
        startNode: any = null, 
        endNode: any = null, 
        startNodeOffset: number = 0, 
        endNodeOffset: number = 0;
    function traverse(node: any): true | undefined {
        // DFS深搜DOM树
        if (node.nodeType === Node.TEXT_NODE) {
            const textLength = node.nodeValue.length;
            if (!startNode && currentOffset + textLength >= startOffset) {
                startNode = node;
                startNodeOffset = startOffset - currentOffset;
            }
            currentOffset += textLength;
            if (!endNode && currentOffset >= endOffset) {
                endNode = node;
                endNodeOffset = endOffset - currentOffset + textLength;
                return true;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.previousSibling === null && 
                startOffset === 0 && 
                endOffset === 0 && 
                node.childNodes[0].nodeType === Node.TEXT_NODE) {
                startNode = node.childNodes[0];
                endNode = node.childNodes[0];
                startNodeOffset = 0;
                endNodeOffset = 0;
                return true;
            }
            for (let child of node.childNodes) {
                const done = traverse(child);
                if (done) return true;
            }
        }
    }
    traverse(div);
    if (startNode && endNode) {
        const range: Range = document.createRange();
        range.setStart(startNode, startNodeOffset);
        range.setEnd(endNode, endNodeOffset);
        return range;
    }
    return null;
}

function createHighlight(top: number, 
                         left: number, 
                         width: number): HTMLDivElement {
    const editorElem: HTMLDivElement = document.getElementsByClassName("toastui-editor md-mode")[0] as HTMLDivElement;
    const highlightDiv: HTMLDivElement = document.createElement('div');
    highlightDiv.className = "amber-highlight--item";
    highlightDiv.style.top = (top + editorElem.scrollTop) + 'px';
    highlightDiv.style.left = left + 'px';
    highlightDiv.style.width = width + 'px';
    return highlightDiv;
}
