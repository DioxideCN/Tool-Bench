// @ts-ignore
import katex from 'katex';
import mermaid from 'mermaid';
import hljs from 'highlight.js';

import { ref } from "vue";
import { Editor } from "@toast-ui/editor";
import { ContextUtil } from "@/util/ContextUtil";
import { SearchUtil } from "@/util/SearchUtil";
import type { AreaType, CacheType } from "@/core/TypeDefinition";
import type { SelectionPos } from "@toast-ui/editor/types/editor";
import type { Ref } from "vue";
import type {PluginEvent, EventHandler, PluginHolder} from "@/extension/ArgumentPlugin";
import {PluginEventHolder} from "@/core/BasicStructure";
import type {AbstractPlugin} from "@/extension/BasePlugin";
import {PluginResolver} from "@/core/PluginResolver";

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
                replace: false,              // 开启替换
                condition: {
                    capitalization: false,   // 大小写敏感
                    regular: false,          // 正则查找
                    keepCap: false,          // 保留大小写
                },
                result: {
                    total: 0,                // 结果总数
                    hoverOn: 0,              // 正在聚焦
                    list: [],                // 搜索结果集
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
        plugin: {
            enable: false,                   // 开启插件菜单
        },
    });

    // define editor instance
    private readonly instance: Editor;
    
    // area 依赖于 afterMounted
    private area: AreaType;

    // event holder
    private readonly eventHolder: PluginEventHolder;
    
    // plugin resolver
    private readonly resolver: PluginResolver;

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
        const lineNumberDOM: HTMLDivElement = document.createElement('div');
        lineNumberDOM.classList.add('editor-line-number');
        lineNumberDOM.classList.add('unselectable');
        lineNumberDOM.innerHTML = '<div class="line-item">1</div>';
        this.instance = new Editor({
            el: editorOuter,
            previewStyle: 'vertical',
            height: 'calc(100% - 30px)',
            placeholder: '请输入内容...',
            hideModeSwitch: true,
            previewHighlight: false,
            toolbarItems: [[]],
            initialValue: rawContent,
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
        this.resolver = new PluginResolver(this);
        this.eventHolder = new PluginEventHolder(this.resolver);
    }

    /**
     * 在构造器中初始化instance后需要通过{@link #build()}
     * 方法对instance对象进行完善和补偿。并在完成构造后将该
     * 核心实例暴露到外部。
     */
    public build(emitter: EventHandler): LucenceCore {
        // 定义编辑器实例的command
        this.instance.addCommand(
            'markdown', 
            'switchTheme', 
            () => this.toggle.theme());
        // Plugin 自动挂载所有插件
        this.resolver.autoload();
        // 嵌入主题切换按钮
        this.updateToolbarItem(LucenceCore.getTheme());
        const that = this;
        // 重写Ctrl+F方法来调用doSearch()
        document.addEventListener('keydown', function(event: KeyboardEvent): void {
            if (event.ctrlKey && event.key === 'f') {
                event.preventDefault();
                LucenceCore._cache.value.feature.search.enable = true;
                let value: string =
                    (document.getElementById("amber-search--input") as HTMLInputElement).value!;
                // 快速复制选中内容到查询框
                if (value.length === 0) {
                    value = window.getSelection()!.toString();
                    (document.getElementById("amber-search--input") as HTMLInputElement).value = value;
                }
                that.doSearch();
            }
        });
        // 构建行数容器
        this.buildLineContainer();
        // 事件更新驱动
        this.instance.on('caretChange', (): void => {
            this.useUpdate();
        });
        this.instance.on('updatePreview', (): void => { 
            LucenceCore.renderCodeBlock(); 
        });
        this.instance.on('afterPreviewRender', (): void => { 
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
        // 事件提交器
        this.eventHolder.register(
            "default_extension",
            {
                type: "content_change",
                desc: "内容自动保存",
                callback: emitter,
            });
        this.eventHolder.register(
            "default_extension",
            {
                type: "content_change",
                desc: "动态更新搜索结果",
                callback: () => {
                    // 更新搜索内容
                    this.doSearch();
                },
            });
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
    private useUpdate() {
        const selection: SelectionPos = this.instance.getSelection();
        const mdContent: string = this.instance.getMarkdown();
        const focusText: string = this.instance.getSelectedText();
        // 更新统计
        const { _wordCount, _characterCount } = ContextUtil.countWord(mdContent);
        // 从栈帧中唤醒所有文本变更事件
        this.tryCallContentEvent(
            LucenceCore._cache.value.feature.count.words, 
            _wordCount);
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
        // 同步更新行容器
        LucenceCore._cache.value.line.oldLineCount = this.area.lineBox.children.length - 8;
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
    }

    /**
     * 根据原始字数和更新后的字数来决定需要调用那些文本变更事件，
     * 这个过程由{@link #useUpdate}方法通过{@link this.eventHolder}自动唤起
     * 
     * @param rawCount 原始字数
     * @param nowCount 更新后的字数
     */
    private tryCallContentEvent(rawCount: number, nowCount: number): void {
        if (rawCount < nowCount) {
            this.eventHolder.callSeries("content_input");
        } else if (rawCount > nowCount) {
            this.eventHolder.callSeries("content_delete");
        }
        if (rawCount === nowCount) {
            this.eventHolder.callSeries("content_select");
            return;
        } else {
            this.eventHolder.callSeries("content_change");
            return;
        }
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
                // 通知主题变更观察者
                this.eventHolder.callSeries("theme_change");
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
            // 通知预览变更观察者
            this.eventHolder.callSeries("switch_preview");
        },
        // 切换自动保存模式
        autoSave: (): void => {
            LucenceCore._cache.value.feature.autoSave = 
                !LucenceCore._cache.value.feature.autoSave;
            // 通知自动保存变更观察者
            this.eventHolder.callSeries("switch_autosave");
        },
        // 切换是否打开查询框
        search: (): void => {
            LucenceCore._cache.value.feature.search.enable = 
                !LucenceCore._cache.value.feature.search.enable;
            this.doSearch();
            // 通知搜索启用变更观察者
            this.eventHolder.callSeries("switch_search");
            // 关闭替换框
            if (!LucenceCore._cache.value.feature.search.enable) {
                LucenceCore._cache.value.feature.search.replace = false;
            }
        },
        // 切换是否打开搜索的替换模式
        replacing: () => {
            LucenceCore._cache.value.feature.search.replace = 
                !LucenceCore._cache.value.feature.search.replace;
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
        // 切换保留大小写
        keepCap: ():void => {
            LucenceCore._cache.value.feature.search.condition.keepCap = 
                !LucenceCore._cache.value.feature.search.condition.keepCap;
        },
        // 切换插件菜单页的显示
        plugin: {
            open: (): void => {
                LucenceCore._cache.value.plugin.enable = true;
            },
            close: (): void => {
                LucenceCore._cache.value.plugin.enable = false;
            }
        },
    }

    /**
     * 执行一次查找，如果查找处于关闭状态那么清空结果和缓存，不进行查找。
     * 如果查找框内为空则从选择区域直接拷贝到查询框中作为条件进行查询。同
     * 时根据 {@link LucenceCore._cache.value.feature.search.condition} 和 
     * {@link LucenceCore._cache.value.feature.search.result} 将条件委派给 
     * {@link SearchUtil#updateHighlight} 方法进行指定条件查找
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
        const value: string = 
            (document.getElementById("amber-search--input") as HTMLInputElement).value!;
        if (!value) return;
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
     * 对文本内容进行逐个替换和全局替换
     * @param isGlobal 是否为全局替换
     */
    public doReplacing(isGlobal: boolean) {
        if (!LucenceCore._cache.value.feature.search.replace ||
            LucenceCore._cache.value.feature.search.result.total === 0) {
            return;
        }
        const value: string =
            (document.getElementById("amber-search--replacing") as HTMLInputElement).value!;
        // 直接往下文定位到最近的结果进行全字替换
        const range: Range | null = this.locateSearchResultAt(true);
        if (range) {
            range.deleteContents();
            range.insertNode(document.createTextNode(value));
        }
    }

    /**
     * 当向下或向上查找时调用该方法来定位到高亮的搜索内容上。
     * @param isDown 是否是向下查找
     */
    public locateSearchResultAt(isDown: boolean): Range | null {
        const result = this.locateNearestOne(isDown);
        if (!result) return null;
        const { awaitArr, selectIndex } = result;
        LucenceCore._cache.value.feature.search.result.hoverOn = selectIndex;
        return this.highlightResult(awaitArr);
    }

    /**
     * 将position位置的字段渲染为搜索结果的高亮区
     * @param position 起始位置的一个4元素长度的数字型数组
     */
    public highlightResult(position: number[]): Range | null {
        return SearchUtil.highlightSelection(
            position[0],
            position[1],
            LucenceCore._cache.value.feature.search.condition.regular ?
                position[2] : position[0],
            LucenceCore._cache.value.feature.search.condition.regular ?
                position[3] : position[1] + (document.getElementById("amber-search--input") as HTMLInputElement).value!.length);
    }

    /**
     * 为查找和替换分理出一个统一的向下查找最近的结果的方法，
     * 并将最近的一个结果的定位点以数组的形式暴露到外部
     * @param isDown 是否为向下查找
     */
    private locateNearestOne(isDown: boolean): { awaitArr: number[], selectIndex: number, } | null {
        if (LucenceCore._cache.value.feature.search.result.total === 0) return null;
        const length: number =
            LucenceCore._cache.value.feature.search.result.list.length;
        const fixLength: number =
            (document.getElementById("amber-search--input") as HTMLInputElement).value!.length;
        let awaitArr: number[] = [], 
            selectedIndex: number = isDown ? length - 1 : 0;
        for (let index: number = 0; index < length; index++) {
            const selection: SelectionPos = this.instance.getSelection(), 
                  searchLength: number = 
                      LucenceCore._cache.value.feature.search.condition.regular ? 
                          (LucenceCore._cache.value.feature.search.result.list[index] as number[])[3] - (LucenceCore._cache.value.feature.search.result.list[index] as number[])[1] :
                          fixLength, 
                  row: number[] =
                      LucenceCore._cache.value.feature.search.result.list[index] as number[];
            let diffRow: number = row[0], diffCol: number = row[1]; // 行间距 列间距
            // 正则回溯查找且row[0]和row[2]不相同，focusRow和focusCol需要重新定位起始位置
            let rowToSubtract: number = 
                    LucenceCore._cache.value.feature.focus.row,
                colToSubtract: number = 
                    LucenceCore._cache.value.feature.focus.col;
            if (!isDown && (row[0] !== row[2]) &&
                LucenceCore._cache.value.feature.search.condition.regular) {
                rowToSubtract = (selection as [number[], number[]])[0][0];
                colToSubtract = (selection as [number[], number[]])[0][1];
            }
            diffRow -= rowToSubtract;
            diffCol -= colToSubtract;
            // 将第一次遍历到的行差>=0的元素作为候选
            if (diffRow >= 0) {
                // 如果行差为0选择第一个遍历到的列差>0的元素作为候选
                if (diffRow === 0) {
                    if ((!isDown && diffCol < 0 && 
                            Math.abs(diffCol) > searchLength) ||
                        (isDown && diffCol < 0 && 
                            Math.abs(diffCol) >= searchLength)) {
                        continue;
                    }
                    let target: number = index;
                    if (!isDown) target--;
                    if (target < 0) target = length - 1;
                    awaitArr =
                        LucenceCore._cache.value.feature.search.result.list[target] as number[];
                    selectedIndex = target;
                    break;
                } else {
                    // 候选必然是下一个，那么候选的前驱节点必然是上一个结果
                    let target: number = index;
                    if (!isDown) target--;
                    if (target < 0) target = length - 1;
                    selectedIndex = target;
                    awaitArr =
                        LucenceCore._cache.value.feature.search.result.list[target] as number[];
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
            awaitArr =
                LucenceCore._cache.value.feature.search.result.list[selectedIndex] as number[];
        }
        return {
            awaitArr: awaitArr,
            selectIndex: selectedIndex + 1,
        };
    }
    
    /**
     * 更新Toolbar第一个位置的主题模式切换按钮
     * @param theme 主题色，一般通过{@link #getTheme()}方法来获取
     */
    private updateToolbarItem(theme: string): void {
        this.instance.removeToolbarItem(`tool-theme-${theme === 'light' ? 'moon' : 'day'}`);
        this.instance.insertToolbarItem({ groupIndex: 0, itemIndex: 0 }, {
            name: `tool-theme-${theme === 'light' ? 'day' : 'moon'}`,
            tooltip: `切换至${theme === 'light' ? '夜间' : '白天'}`,
            command: 'switchTheme',
            className: `fa-solid fa-${theme === 'light' ? 'sun' : 'moon'}`,
        });
    }

    /**
     * 富文本编辑器的事件调用和唤起
     */
    public on(plugin: AbstractPlugin,
              event: PluginEvent,
              desc: string,
              callback: EventHandler): void {
        // 事件类型和回调器压栈
        this.eventHolder.register(
            plugin.detail.name,
            {
                type: event,
                desc: desc,
                callback: callback,
            });
    }
    
    // 返回缓存
    static get cache(): Ref<CacheType> {
        return LucenceCore._cache;
    }
    // 编辑器实例
    get editor(): Editor {
        return this.instance;
    }
    // 插件列表
    get plugins(): Ref<PluginHolder[]> {
        return ref(this.resolver.pluginList);
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
    private static getTheme(): 'light' | 'night' {
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
    private static renderMermaid(): void {
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
    private static renderCodeBlock(): void {
        const elements = document.getElementsByClassName('hljs');
        for (let element of elements) {
            hljs.highlightElement(element as HTMLElement);
        }
    }
    
}
