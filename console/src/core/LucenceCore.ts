// @ts-ignore
import katex from 'katex';
import mermaid from 'mermaid';
import hljs from 'highlight.js';

import { ref } from "vue";
import { Editor } from "@toast-ui/editor";
import { ContextUtil } from "@/util/ContextUtil";
import { SearchUtil } from "@/util/SearchUtil";
import { DefaultPlugin } from "@/extension/DefaultPlugin";
import type { AreaType, CacheType } from "@/core/TypeDefinition";
import type { SelectionPos } from "@toast-ui/editor/types/editor";
import type { Ref } from "vue";

export class LucenceCore {
    
    // define cache in core
    private static _cache: Ref<CacheType> = ref({
        line: {
            oldLineCount: 1,
            prevIndexMap: new Map<number, number>(),
        },
        feature: {
            preview: true,                   // 启用预览
            autoSave: true,                  // 自动保存
            search: {
                enable: false,               // 开启查找
                condition: {
                    capitalization: false,   // 大小写敏感
                    regular: false,          // 正则查找
                },
                result: {
                    total: 0,
                    hoverOn: 0,
                    list: [],
                },
            },
            count: {
                words: 0,                    // 总计词数
                characters: 0,               // 总计字符数
                selected: 0,                 // 已选择字符数
            },
            focus: {
                row: 1,                      // 聚焦的行
                col: 1,                      // 聚焦的列
            }
        },
        theme: LucenceCore.getTheme(),       // 深浅色模式
    });

    // define editor instance
    private instance: Editor;
    
    // area 依赖于 afterMounted
    private area: AreaType;

    /**
     * 构造器内完成对ToastUIEditor的定义
     * 这包括toolbar、自定义的渲染规则和命令注册
     */
    constructor(rawContent: string) {
        const editorOuter: HTMLElement = 
            document.querySelector('#toast-editor') as HTMLElement;
        if (!editorOuter) {
            throw new Error('Cannot find element from id \'#toast-editor\'!');
        }
        const lineNumberDOM = document.createElement('div');
        lineNumberDOM.className = 'editor-line-number';
        lineNumberDOM.innerHTML = '<div class="line-item">1</div>';
        this.instance = new Editor({
            el: editorOuter,
            previewStyle: 'vertical',
            height: 'calc(100% - 30px)',
            placeholder: '请输入内容...',
            hideModeSwitch: true,
            previewHighlight: false,
            toolbarItems: [[]],
            // 定义Markdown到HTML的渲染规则
            customHTMLRenderer: {
                codeBlock(node: any): any {
                    if (node.info === "mermaid") {
                        return [
                            { type: 'openTag', tagName: 'div', classNames: [node.info, 'mermaid-box'] },
                            { type: 'text', content: node.literal! },
                            { type: 'closeTag', tagName: 'div' }
                        ];
                    }
                    return [
                        { type: 'openTag', tagName: 'pre', classNames: ['hljs', 'language-' + node.info] },
                        { type: 'openTag', tagName: 'code', classNames: ['language-' + node.info] },
                        { type: 'text', content: node.literal! },
                        { type: 'closeTag', tagName: 'code' },
                        { type: 'closeTag', tagName: 'pre' }
                    ];
                },
                text(node: any): any {
                    // 渲染latex公式
                    const content: string = node.literal;
                    const regex: RegExp = /\$(.+?)\$/g;
                    let result: any;
                    let lastIndex: number = 0;
                    const tokens: any = [];
                    while (result = regex.exec(content)) {
                        const [match, innerContent] = result;
                        if (lastIndex !== result.index) {
                            tokens.push({
                                type: 'text',
                                content: content.slice(lastIndex, result.index),
                            });
                        }
                        const span = document.createElement('span');
                        try {
                            katex.render(innerContent, span);
                            // 检查渲染后的内容是否为空
                            if (span.innerHTML.trim() !== "") {
                                tokens.push({
                                    type: 'html',
                                    content: span.outerHTML,
                                });
                            } else {
                                tokens.push({
                                    type: 'text',
                                    content: match,
                                });
                            }
                        } catch (e) {
                            // 如果渲染失败，则回退到原始文本
                            tokens.push({
                                type: 'text',
                                content: match,
                            });
                        }
                        lastIndex = regex.lastIndex;
                    }
                    if (lastIndex < content.length) {
                        tokens.push({
                            type: 'text',
                            content: content.slice(lastIndex),
                        });
                    }
                    return tokens;
                },
                latex(node: any): any {
                    // 渲染块状latex
                    const raw: string = node.literal;
                    const span = document.createElement('span');
                    const tokens: any = [
                        { type: 'openTag', tagName: 'p', classNames: ['lucency-latex'], outerNewLine: true }
                    ];
                    try {
                        katex.render(raw, span);
                        tokens.push({
                            type: 'html',
                            content: span.outerHTML,
                        });
                    } catch (e) {
                        span.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Wrong Latex syntax!'
                        span.style.color = 'rgb(228, 105, 98)';
                        span.style.fontStyle = 'italic';
                        tokens.push({
                            type: 'html',
                            content: span.outerHTML,
                        });
                    }
                    tokens.push({ type: 'closeTag', tagName: 'p', outerNewLine: true })
                    return tokens;
                },
            },
        });
        this.instance.setMarkdown(rawContent);
        this.area = {
            // 预览区
            preview: document.getElementsByClassName('toastui-editor-md-preview')[0]! as HTMLElement,
            // 编辑区包括行容器和markdown编辑器
            editor: document.getElementsByClassName('toastui-editor md-mode')[0]! as HTMLElement,
            // 编辑区与预览区之间的分割线
            split: document.getElementsByClassName('toastui-editor-md-splitter')[0]! as HTMLElement,
            // markdown编辑器
            mdEditor: document.getElementsByClassName('toastui-editor md-mode')[0].getElementsByClassName('ProseMirror')[0]! as HTMLElement,
            // 暂不定义
            lineBox: lineNumberDOM,
        }
    }

    /**
     * 在构造器中初始化instance后需要通过{@link #build()}
     * 方法对instance对象进行完善和补偿。并在完成构造后将该
     * 核心实例暴露到外部。
     */
    public build(): LucenceCore {
        // 定义编辑器实例的command
        this.instance.addCommand(
            'markdown', 
            'switchTheme', 
            () => this.toggle.theme());
        // 导入DefaultPlugin插件
        const plugin: DefaultPlugin = new DefaultPlugin(this.instance);
        plugin.createCommands(); // 初始化插件的commands
        // 通过DefaultPlugin构造Toolbar
        const { items } = plugin.createToolbar();
        for (let i: number = 0; i < items.length; i++) {
            this.instance.insertToolbarItem({
                groupIndex: 0,
                itemIndex: i,
            }, items[i])
        }
        // 嵌入主题切换按钮
        this.updateToolbarItem(LucenceCore.getTheme());
        const that = this;
        // 重写Ctrl+F方法来调用doSearch()
        document.addEventListener('keydown', function(event) {
            if (event.ctrlKey && event.key === 'f') {
                event.preventDefault();
                LucenceCore._cache.value.feature.search.enable = true;
                that.doSearch();
            }
        });
        // 构建行数容器
        this.buildLineContainer();
        // 事件更新驱动
        this.instance.on('caretChange', () => {
            this.useUpdate(); 
        });
        this.instance.on('updatePreview', () => { 
            LucenceCore.renderCodeBlock(); 
        });
        this.instance.on('afterPreviewRender', () => { 
            LucenceCore.renderMermaid(); 
        });
        // 预热
        const mdEditor: Element = 
            this.area.editor.getElementsByClassName('ProseMirror')[0];
        this.useUpdate();
        ContextUtil.onResize(
            mdEditor, 
            this.useUpdate.bind(this), 
            this.doSearch.bind(this));
        LucenceCore.renderCodeBlock();
        this.syncScroll();
        LucenceCore.renderMermaid();
        // 在构建成功后将instance实例暴露到全局
        return this;
    }

    /**
     * 定义同步滚动
     */
    private syncScroll(): void {
        const previewElem: HTMLDivElement = document.querySelectorAll(".toastui-editor-md-preview .toastui-editor-contents")[0] as HTMLDivElement;
        let isProgrammaticScroll = false;
        const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
            const scale = target.scrollHeight / source.scrollHeight;
            const newScrollTop = source.scrollTop * scale;
            isProgrammaticScroll = true;
            target.scrollTop = newScrollTop;
        }
        this.area.editor.addEventListener('scroll', () => {
            if (isProgrammaticScroll) return;
            syncScroll(this.area.editor as HTMLDivElement, previewElem);
            setTimeout(() => { isProgrammaticScroll = false; }, 0);
        });
        previewElem.addEventListener('scroll', () => {
            if (isProgrammaticScroll) return;
            syncScroll(previewElem, this.area.editor as HTMLDivElement);
            setTimeout(() => { isProgrammaticScroll = false; }, 0);
        });
    }

    /**
     * 构建行数容器，用来显示行
     */
    private buildLineContainer(): void {
        // 构造高亮标记容器
        const amberHighlightDOM = document.createElement('div');
        amberHighlightDOM.id = "amber-highlight--group";
        this.area.editor.insertBefore(this.area.lineBox, this.area.editor.childNodes[0]);
        this.area.editor.append(amberHighlightDOM);
    }

    /**
     * 更新所有缓存
     */
    public useUpdate() {
        const selection: SelectionPos = this.instance.getSelection();
        const mdContent: string = this.instance.getMarkdown();
        const focusText: string = this.instance.getSelectedText();
        // 更新统计
        const { _wordCount, _characterCount } = ContextUtil.countWord(mdContent);
        // 更新统计的字数、词数、选中数、聚焦行、聚焦列
        LucenceCore._cache.value.feature.count = {
            words: _wordCount,
            characters: _characterCount,
            selected: ContextUtil.Line.countSelect(focusText),
        }
        LucenceCore._cache.value.feature.focus = {
            row: (selection as [number[], number[]])[1][0],
            col: (selection as [number[], number[]])[1][1],
        }
        // 更新行
        const getter = ContextUtil.Line.count(
            this.area.mdEditor, 
            selection,
            LucenceCore._cache.value.line.prevIndexMap,
            LucenceCore._cache.value.line.oldLineCount);
        // 更新空行补齐的集合
        LucenceCore._cache.value.line = {
            prevIndexMap: getter.prevIndexMap,
            oldLineCount: getter.oldLineCount,
        }
        // 更新行容器
        const fragment = getter.newLineContainer;
        if (fragment) {
            this.area.lineBox.innerHTML = '';
            this.area.lineBox.appendChild(fragment);
        }
        // 更新搜索内容
        this.doSearch();
    }

    /**
     * 模式切换组
     */
    public toggle = {
        // 切换深浅色模式
        theme: (): boolean => {
            const editorDiv = document.getElementById('toast-editor');
            if (editorDiv) {
                const newTheme: "light" | "night" = LucenceCore.getTheme() === 'light' ? 'night' : 'light';
                LucenceCore._cache.value.theme = newTheme;
                localStorage.setItem('editor-theme', newTheme);
                this.updateToolbarItem(newTheme);
                return true;
            }
            return false;
        },
        // 切换预览模式
        preview: (): void => {
            LucenceCore._cache.value.feature.preview = 
                !LucenceCore._cache.value.feature.preview;
            const displayWhat: string =
                LucenceCore._cache.value.feature.preview ? '' : 'none';
            this.area.preview.style.display = displayWhat;
            this.area.split.style.display = displayWhat;
            this.area.editor.style.width =
                LucenceCore._cache.value.feature.preview ? '50%' : '100%';
        },
        // 切换自动保存模式
        autoSave: (): void => {
            LucenceCore._cache.value.feature.autoSave = 
                !LucenceCore._cache.value.feature.autoSave;
        },
        // 切换是否打开查询框
        search: (): void => {
            LucenceCore._cache.value.feature.search.enable = 
                !LucenceCore._cache.value.feature.search.enable;
            this.doSearch();
        },
        // 切换正则规则搜索
        regular: ():void => {
            LucenceCore._cache.value.feature.search.condition.regular = 
                !LucenceCore._cache.value.feature.search.condition.regular;
            this.doSearch();
        },
        // 切换大小写敏感搜索
        capitalization: ():void => {
            LucenceCore._cache.value.feature.search.condition.capitalization = 
                !LucenceCore._cache.value.feature.search.condition.capitalization;
            this.doSearch();
        },
    }

    /**
     * 执行一次查找，如果查找处于关闭状态那么清空结果和缓存，不进行查找。
     * 如果查找框内为空则从选择区域直接拷贝到查询框中作为条件进行查询。同
     * 时根据 {@link this._cache.feature.search.condition} 和 
     * {@link this._cache.feature.search.result} 将条件委派给 
     * {@link SearchUtil#updateIt} 方法进行指定条件查找
     */
    public doSearch(): void {
        // 未启用搜索需要清空容器
        if (!LucenceCore._cache.value.feature.search.enable) {
            const amberContainer = 
                document.getElementById("amber-highlight--group");
            if (amberContainer) {
                amberContainer.innerHTML = "";
            }
            return;
        }
        let value: string = 
            (document.getElementById("amber-search--input") as HTMLInputElement).value!;
        // 快速复制选中内容到查询框
        if (value.length === 0) {
            value = window.getSelection()!.toString();
            (document.getElementById("amber-search--input") as HTMLInputElement).value = value;
        }
        if (!LucenceCore._cache.value.feature.search.condition.regular) {
            // 纯文本内容查询
            const { total, markList } = SearchUtil.text(
                this.instance.getMarkdown(), 
                value,
                LucenceCore._cache.value.feature.search.condition.capitalization);
            SearchUtil.updateHighlight(
                LucenceCore._cache.value.feature.search.result,
                LucenceCore._cache.value.feature.search.condition,
                total,
                markList,
                value);
        } else {
            const { total, markList } = SearchUtil.regex(
                this.instance.getMarkdown(), 
                value,
                LucenceCore._cache.value.feature.search.condition.capitalization);
            SearchUtil.updateHighlight(
                LucenceCore._cache.value.feature.search.result,
                LucenceCore._cache.value.feature.search.condition,
                total,
                markList,
                value);
        }
    }

    /**
     * 将position位置的字段渲染为搜索结果的高亮区
     * @param position 起始位置的一个4元素长度的数字型数组
     */
    public highlightResult(position: number[]): void {
        if (LucenceCore._cache.value.feature.search.condition.regular) {
            SearchUtil.highlightSelection(
                position[0], 
                position[1], 
                position[2], 
                position[3]);
        } else {
            SearchUtil.highlightSelection(
                position[0], 
                position[1], 
                position[0], 
                position[1] + (document.getElementById("amber-search--input") as HTMLInputElement).value!.length);
        }
    }

    /**
     * 当向下或向上查找时调用该方法来定位到高亮的搜索内容上
     * @param isDown 是否是向下查找
     */
    public locateSearchResultAt(isDown: boolean): void {
        if (LucenceCore._cache.value.feature.search.result.total === 0) return;
        const length = LucenceCore._cache.value.feature.search.result.list.length;
        const fixLength = (document.getElementById("amber-search--input") as HTMLInputElement).value!.length;
        let awaitArr: number[] = [];
        let selectedIndex = isDown ? length - 1 : 0;
        for (let index = 0; index < length; index++) {
            const selection = this.instance.getSelection();
            // @ts-ignore
            const searchLength = this._cache.feature.search.condition.regular ? this._cache.feature.search.result.list[index][3] - this._cache.feature.search.result.list[index][1] : fixLength;
            const row: number[] = LucenceCore._cache.value.feature.search.result.list[index] as number[];
            let diffRow: number = row[0]; // 行间距
            let diffCol: number = row[1]; // 列间距
            // 如果是正则的向上查找并且row[0]和row[2]不相同
            // 那么focusRow和focusCol应该通过window.getSelection()来重新定位起始位置
            let rowToSubtract: number = LucenceCore._cache.value.feature.focus.row;
            let colToSubtract: number = LucenceCore._cache.value.feature.focus.col;
            if (!isDown && (row[0] !== row[2]) && LucenceCore._cache.value.feature.search.condition.regular) {
                rowToSubtract = (selection as [number[], number[]])[0][0];
                colToSubtract = (selection as [number[], number[]])[0][1];
            }
            diffRow -= rowToSubtract;
            diffCol -= colToSubtract;
            // 将第一次遍历到的行差>=0的元素作为候选
            if (diffRow >= 0) {
                // 如果行差=0选择第一个遍历到的列差>0的元素作为候选
                if (diffRow === 0) {
                    if ((!isDown && diffCol < 0 && Math.abs(diffCol) > searchLength) || (isDown && diffCol < 0 && Math.abs(diffCol) >= searchLength)) {
                        continue;
                    }
                    let target = index;
                    if (!isDown) {
                        target--;
                    }
                    if (target < 0) {
                        target = length - 1;
                    }
                    // @ts-ignore
                    awaitArr = this._cache.feature.search.result.list[target];
                    selectedIndex = target;
                    break;
                } else {
                    // 候选必然是下一个，候选的前驱节点必然是上一个
                    let target = index;
                    if (!isDown) {
                        target--;
                    }
                    if (target < 0) {
                        target = length - 1;
                    }
                    selectedIndex = target;
                    // @ts-ignore
                    awaitArr = this._cache.feature.search.result.list[target];
                    break;
                }
            }
        }
        if (awaitArr.length === 0) {
            if (isDown) {
                selectedIndex = 0;
            } else {
                selectedIndex = length - 1;
            }
            // @ts-ignore
            awaitArr = this._cache.feature.search.result.list[selectedIndex];
        }
        LucenceCore._cache.value.feature.search.result.hoverOn = selectedIndex + 1;
        this.highlightResult(awaitArr);
    }

    /**
     * 更新Toolbar第一个位置的主题模式切换按钮
     * @param theme 主题色，一般通过{@link #getTheme()}方法来获取
     */
    public updateToolbarItem(theme: string) {
        this.instance.removeToolbarItem(`tool-theme-${theme === 'light' ? 'moon' : 'day'}`);
        this.instance.insertToolbarItem({ groupIndex: 0, itemIndex: 0 }, {
            name: `tool-theme-${theme === 'light' ? 'day' : 'moon'}`,
            tooltip: `切换至${theme === 'light' ? '夜间' : '白天'}`,
            command: 'switchTheme',
            className: `fa-solid fa-${theme === 'light' ? 'sun' : 'moon'}`,
        });
    }
    
    static get cache(): Ref<CacheType> {
        return LucenceCore._cache;
    }

    /* 静态方法区 */
    
    static {
        // 静态初始化mermaid语法
        mermaid.initialize({ 
            startOnLoad: true,
        });
        // 静态初始化highlight.js
        hljs.configure({
            ignoreUnescapedHTML: true,
            throwUnescapedHTML: false,
        });
    }

    /**
     * 返回当前编辑器的主题色
     * @return string 'light' 浅色模式或 'dark' 深色模式
     */
    public static getTheme(): 'light' | 'night' {
        let theme: string | null = localStorage.getItem('editor-theme');
        if (theme !== 'light' && theme !== 'night') {
            theme = 'light';
            localStorage.setItem('editor-theme', theme);
        }
        // @ts-ignore
        return theme;
    }

    /**
     * 为所有class为".mermaid.mermaid-box"的容器渲染mermaid语法
     */
    public static renderMermaid(): void {
        mermaid.init(
            undefined,
            document.querySelectorAll('.mermaid.mermaid-box'))
            .catch(e => {
                console.error(e);
            });
    }

    /**
     * 为所有class为".hljs"的容器渲染代码块
     */
    public static renderCodeBlock(): void {
        const elements = document.getElementsByClassName('hljs');
        for (let element of elements) {
            hljs.highlightElement(element as HTMLElement);
        }
    }
    
}
