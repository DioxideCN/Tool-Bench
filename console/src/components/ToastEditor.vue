<template>
    <section :data-theme="currentTheme" class="toast-wrapper">
        <div id="toast-editor"></div>
        <div class="toolbar-stat-panel">
            <div class="stat-head">
                <i class="fa-solid fa-plug"></i>
            </div>
            <div class="stat-panel">
                <div class="stat-panel--left">
                    <span class="stat-panel--key">
                        <i style="position: relative;top: -1px;font-size: 12px;" class="fa-solid fa-gear"></i>设置
                    </span>
                    <span class="stat-panel--key" @click="openSearch()">
                        <i style="position: relative;top: -1px;font-size: 12px;" class="fa-solid fa-magnifying-glass"></i>查找
                    </span>
                    <span class="stat-panel--key" @click="switchAutoSave()">
                        <i style="position: relative;top: -1px;font-size: 12px;" class="fa-solid fa-floppy-disk"></i>{{ autoSave ? '自动' : '手动' }}保存
                    </span>
                </div>
                <div class="stat-panel--right">
                    <span class="stat-panel--key">
                        行 {{ focusRow }}, 列 {{ focusCol }}{{ selectCount ? ` (已选择${selectCount})` : '' }}
                    </span>
                    <span class="stat-panel--key">
                        字词 {{ wordCount }}, 字符 {{ characterCount }}
                    </span>
                    <span class="stat-panel--key">
                        <i style="position: relative;top: -1px;font-size: 12px;" class="fa-solid fa-terminal"></i>Markdown
                    </span>
                    <span class="stat-panel--key" @click="switchPreview()">
                        <i class="fa-solid" style="margin-right: 0;" :class="previewEnable?'fa-eye':'fa-eye-slash'"></i>
                    </span>
                    <span class="stat-panel--key last">
                        <a href="https://github.com/DioxideCN/Tool-Bench" target="_blank"><i class="fa-brands fa-github"></i></a>
                    </span>
                </div>
            </div>
        </div>
        <div id="amber-popup--group" class="amber-popup">
            <div class="amber-popup--search" :style="'display:' + (searchEnable?'block':'none')">
                <div class="amber-popup--ahead">
                    <div class="amber-popup--group">
                        <input @input="doSearch()" id="amber-search--input" type="text" placeholder="查找" />
                        <i @click="switchSearchCondition1()" :class="searchCondition.capitalization?'active':''" class="fa-solid fa-a amber-popup--capitalization"></i>
                        <i @click="switchSearchCondition2()" :class="searchCondition.regular?'active':''" class="fa-solid fa-asterisk amber-popup--regular"></i>
                    </div>
                    <span class="amber-popup--result">{{ searchResult.total === 0 ? '无结果' : ('第 ' + searchResult.hoverOn + ' 项, 共 ' + searchResult.total) + ' 项' }}</span>
                    <div class="amber-popup--btn">
                        <i :class="searchResult.total === 0 ? 'disable' : ''" class="fa-solid fa-arrow-up amber-popup--last" @click="locateSearchResultAt(false)"></i>
                        <i :class="searchResult.total === 0 ? 'disable' : ''" class="fa-solid fa-arrow-down amber-popup--next" @click="locateSearchResultAt(true)"></i>
                        <i class="fa-solid fa-xmark amber-popup--close" @click="openSearch()"></i>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script lang="ts" setup>
// @ts-ignore
import katex from 'katex';
// @ts-ignore
import renderMathInElement from 'katex/contrib/auto-render/auto-render';
import mermaid from 'mermaid';
import hljs from 'highlight.js';
import { onMounted, ref } from "vue";
import { Editor } from "@toast-ui/editor";
import { PopupBuilder } from "@/util/PopupBuilder";
import { ContextUtil } from "@/util/ContextUtil";
import { SearchUtil } from "@/util/SearchUtil";

const renderOption = {
	delimiters: [
		{left: '$$', right: '$$', display: true},
		{left: '$', right: '$', display: false},
		{left: '\\(', right: '\\)', display: false},
		{left: '\\[', right: '\\]', display: true}
	],
	throwOnError : false
}
// 渲染Katex
function renderKatex(dom: HTMLElement) {
	renderMathInElement(dom, renderOption)
}
// @ts-ignore
window.renderKatex = renderKatex;

// @ts-ignore
window.mermaid = mermaid;
mermaid.initialize({startOnLoad: true});
hljs.configure({
    ignoreUnescapedHTML: true,
    throwUnescapedHTML: false,
});
function renderMermaid() {
    mermaid.init(undefined, document.querySelectorAll('.mermaid.mermaid-box'));
}

// 编辑器主题
function getTheme(): string {
    let theme = localStorage.getItem('editor-theme');
    if (!theme) {
        theme = 'light';
        localStorage.setItem('editor-theme', theme);
    }
    return theme;
}

const searchEnable = ref(false); // 查找
const searchCondition = ref({    // 条件查找
    capitalization: false,            // 大小写敏感
    regular: false,                   // 正则查找
});
const previewEnable = ref(true); // 启用预览
const autoSave = ref(true);      // 自动保存
const wordCount = ref(0);        // 词数
const characterCount = ref(0);   // 字符数
const selectCount = ref(0);      // 已选择
const focusRow = ref(1);         // 聚焦行数
const focusCol = ref(1);         // 聚焦列数
const currentTheme = ref(getTheme());
// 定义父子组件传值
const props = defineProps({
    raw: {
        type: String,
        required: false,
        default: "",
    },
    content: {
        type: String,
        required: false,
        default: "",
    },
});

// 切换自动保存
function switchAutoSave(): void {
    autoSave.value = !autoSave.value;
}
// 切换预览状态
function switchPreview(): void {
    previewEnable.value = !previewEnable.value;
    const previewArea: any = document.getElementsByClassName('toastui-editor-md-preview')[0];
    const splitArea: any = document.getElementsByClassName('toastui-editor-md-splitter')[0];
    const editArea: any = document.getElementsByClassName('toastui-editor md-mode')[0];
    if (previewArea && splitArea && editArea) {
        const trigger: boolean = previewEnable.value;
        const displayWhat: string = trigger ? '' : 'none';
        previewArea.style.display = displayWhat;
        splitArea.style.display = displayWhat;
        editArea.style.width = trigger ? '50%' : '100%';
    }
}
// 定义emit事件
const emit = defineEmits<{
    (event: "update:raw", value: string): void;
    (event: "update:content", value: string): void;
    (event: "update", value: string): void;
}>();
// 渲染code block
function renderCodeBlock() {
    const elements = document.getElementsByClassName('hljs');
    for (let element of elements) {
        hljs.highlightElement(element as HTMLElement);
    }
}
// 执行查询
let doSearch = () => {};
// 启用查询
function openSearch(): void {
    searchEnable.value = !searchEnable.value;
    doSearch();
}
// 条件查询切换
function switchSearchCondition1(): void {
    searchCondition.value.capitalization = !searchCondition.value.capitalization;
    doSearch();
}
function switchSearchCondition2(): void {
    searchCondition.value.regular = !searchCondition.value.regular;
    doSearch();
}
// 更新查找结果
const searchResult = ref({
    total: 0,
    hoverOn: 0,
    list: [],
});
// 定位最近的搜索结果
function highlightResult(arr: number[]) {
    if (searchCondition.value.regular) {
        SearchUtil.highlightSelection(arr[0], arr[1], arr[2], arr[3]);
    } else {
        SearchUtil.highlightSelection(arr[0], arr[1], arr[0], arr[1] + (document.getElementById("amber-search--input") as HTMLInputElement).value!.length);
    }
}
let locateSearchResultAt = (isDown: boolean) => {};

onMounted(async () => {
    // 初始化Toast编辑器
    let oldLineCount: number = 1;
    let prevIndexMap = new Map<number, number>();
    const instance: Editor = new Editor({
        el: document.querySelector('#toast-editor')!,
        previewStyle: 'vertical',
        height: 'calc(100% - 30px)',
        placeholder: '请输入内容...',
        hideModeSwitch: true,
        previewHighlight: false,
        toolbarItems: [[
            {
                name: 'tool-head',
                tooltip: '标题',
                className: 'fa-solid fa-heading',
                state: 'heading',
                popup: {
                body: (() => {
                    function callback(level: number) {
                      closeCallback();
                      instance.eventEmitter.emit('command', 'heading', { level });
                    }
                    const headings = [
                        { level: 1, text: '# 一级标题' },
                        { level: 2, text: '## 二级标题' },
                        { level: 3, text: '### 三级标题' },
                        { level: 4, text: '#### 四级标题' },
                        { level: 5, text: '##### 五级标题' },
                        { level: 6, text: '###### 六级标题' },
                    ];
                    const headingElements = headings.map(({ level, text }) =>
                        PopupBuilder.UseRegular.heading(level, text, callback)
                    );
                    return PopupBuilder.build('标题', closeCallback, ...headingElements,);
                })(),
                className: 'popup-tool-heading',
                style: {},
                }
            },
            {
                name: 'tool-bold',
                tooltip: '加粗',
                command: 'bold',
                className: 'fa-solid fa-bold',
                state: 'strong',
            },
            {
                name: 'tool-italic',
                tooltip: '斜体',
                command: 'italic',
                className: 'fa-solid fa-italic',
                state: 'emph',
            },
            {
                name: 'tool-strike',
                tooltip: '删除线',
                command: 'strike',
                className: 'fa-solid fa-strikethrough',
                state: 'strike',
            },
            {
                name: 'tool-li',
                tooltip: '无序列表',
                command: 'bulletList',
                className: 'fa-solid fa-list-ul',
                state: 'bulletList',
            },
            {
                name: 'tool-ol',
                tooltip: '有序列表',
                command: 'orderedList',
                className: 'fa-solid fa-list-ol',
                state: 'orderedList',
            },
            {
              name: 'tool-task',
              tooltip: '任务列表',
              command: 'taskList',
              className: 'fa-solid fa-list-check',
              state: 'taskList',
            },
            {
                name: 'tool-quote',
                tooltip: '引用',
                command: 'blockQuote',
                className: 'fa-solid fa-quote-left',
                state: 'blockQuote',
            },
            {
                name: 'tool-code',
                tooltip: '行内代码',
                command: 'code',
                className: 'fa-solid fa-code',
                state: 'code',
            },
            {
                name: 'tool-codeBlock',
                tooltip: '代码块',
                command: 'codeBlock',
                className: 'fa-solid fa-laptop-code',
                state: 'codeBlock',
            },
            {
                name: 'tool-table',
                tooltip: '表格',
                className: 'fa-solid fa-table',
                state: 'table',
                popup: {
                    body: (() => {
                        function callback(x: number, y: number) {
                            closeCallback();
                            insertTable(x, y);
                        }
                        const tableDom = PopupBuilder.UseRegular.table(callback);
                        return PopupBuilder.build('表格', closeCallback, tableDom);
                    })(),
                    className: 'popup-tool-table',
                    style: { width: '240px' },
                }
            },
            {
                name: 'tool-link',
                tooltip: '链接',
                className: 'fa-solid fa-link',
                popup: {
                    body: (() => {
                        function callback(alt: string, url: string) {
                            closeCallback();
                            insertLink(alt, url);
                        }
                        const linkDom = PopupBuilder.UseRegular.link(callback);
                        return PopupBuilder.build('链接', closeCallback, linkDom);
                    })(),
                    className: 'popup-tool-link',
                    style: { width: '300px' },
                }
            },
            {
                name: 'tool-image',
                tooltip: '图片',
                className: 'fa-solid fa-image',
                popup: {
                    body: (() => {
                        function callback(alt: string, url: string) {
                            closeCallback();
                            insertImage(alt, url);
                        }
                        const linkDom = PopupBuilder.UseRegular.image(callback);
                        return PopupBuilder.build('图片', closeCallback, linkDom);
                    })(),
                    className: 'popup-tool-image',
                    style: { width: '300px' },
                }
            },
            {
                name: 'tool-emoji',
                tooltip: '表情',
                className: 'fa-solid fa-face-laugh-wink',
                popup: {
                    body: (() => {
                        const emojiElement = PopupBuilder.UseRegular.emoji(
                            function callback(emoji: string) {
                              closeCallback();
                              insertEmoji(emoji);
                            },
                            ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','😘','😗','😙','😚','😋','😛','😝','😜','🤓','😎','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','😢','😭','😤','😠','😡','😳','😱','😨','🤗','🤔','😶','😑','😬','🙄','😯','😴','😷','🤑','😈','🤡','💩','👻','💀','👀','👣','👐','🙌','👏','🤝','👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤘','👌','👈','👉','👆','👇','☝️','✋','🤚','🖐','🖖','👋','🤙','💪','🖕','✍️','🙏']
                        );
                        return PopupBuilder.build('表情', closeCallback, emojiElement);
                    })(),
                  className: 'popup-tool-emoji',
                  style: {},
                },
            },
        ]],
        customHTMLRenderer: {
            codeBlock(node: any) {
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
            text(node: any) {
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
            latex(node: any) {
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
                    span.innerText = '错误的Latex语法'
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
    
    // 定义查询方法
    doSearch = () => {
        // 未启用搜索需要清空容器
        if (!searchEnable.value) {
            const amberContainer = document.getElementById("amber-highlight--group");
            if (amberContainer) {
                amberContainer.innerHTML = "";
            }
            return;
        }
        let value: string = (document.getElementById("amber-search--input") as HTMLInputElement).value!;
        // 快速复制选中内容到查询框
        if (value.length === 0) {
            value = window.getSelection()!.toString();
            (document.getElementById("amber-search--input") as HTMLInputElement).value = value;
        }
        if (!searchCondition.value.regular) {
            // 纯文本内容查询
            const { total, markList } = SearchUtil.text(instance.getMarkdown(), value, searchCondition.value.capitalization);
            SearchUtil.updateIt(searchResult, 
                searchCondition, 
                total, 
                markList,
                value);
        } else {
            const { total, markList } = SearchUtil.regex(instance.getMarkdown(), value, searchCondition.value.capitalization);
            SearchUtil.updateIt(searchResult, 
                searchCondition, 
                total, 
                markList,
                value);
        }
    }
    
    // 关闭弹窗
    function closeCallback() {
        instance.eventEmitter.emit('closePopup');
    }
    // 更新主题按钮
    function updateToolbarItem(theme: string) {
        instance.removeToolbarItem(`tool-theme-${theme === 'light' ? 'moon' : 'day'}`);
        instance.insertToolbarItem({ groupIndex: 0, itemIndex: 0 }, {
            name: `tool-theme-${theme === 'light' ? 'day' : 'moon'}`,
            tooltip: `切换至${theme === 'light' ? '夜间' : '白天'}`,
            command: 'switchTheme',
            className: `fa-solid fa-${theme === 'light' ? 'sun' : 'moon'}`,
        });
    }
    // 切换主题
    function switchTheme(): boolean {
        const editorDiv = document.getElementById('toast-editor');
        if (editorDiv) {
            const newTheme = getTheme() === 'light' ? 'night' : 'light';
            currentTheme.value = newTheme;
            localStorage.setItem('editor-theme', newTheme);
            updateToolbarItem(newTheme);
            return true;
        }
        return false;
    }
    // 插入表情
    function insertEmoji(emoji: string): boolean {
        return ContextUtil.UseRegular.createEmoji(emoji, instance);
    }
    // 插入表格
    function insertTable(x: number, y: number): boolean {
        return ContextUtil.UseRegular.createTable(x, y, instance);
    }
    // 插入超链接
    function insertLink(alt: string, url: string): boolean {
        return ContextUtil.UseRegular.createLink(alt, url, instance);
    }
    // 插入图片
    function insertImage(alt: string, url: string): boolean {
        return ContextUtil.UseRegular.createImage(alt, url, instance);
    }
    
    updateToolbarItem(getTheme());
    instance.addCommand('markdown', 'switchTheme', () => switchTheme());
    instance.setMarkdown(props.raw);
    
    // 构造行数容器
    const editorArea: Element = document.getElementsByClassName('toastui-editor md-mode')[0];
    const mdEditor: Element = editorArea.getElementsByClassName('ProseMirror')[0];
    const lineNumberDOM = document.createElement('div');
    lineNumberDOM.className = 'editor-line-number';
    lineNumberDOM.innerHTML = '<div class="line-item">1</div>';
    // 构造高亮标记容器
    const amberHighlightDOM = document.createElement('div');
    amberHighlightDOM.id = "amber-highlight--group";
    editorArea.insertBefore(lineNumberDOM, editorArea.childNodes[0]);
    editorArea.append(amberHighlightDOM);
    function useUpdate() {
        const selection = instance.getSelection();
        const mdContent = instance.getMarkdown();
        const focusText = instance.getSelectedText();
        // 更新统计
        const { _wordCount, _characterCount } = ContextUtil.countWord(mdContent);
        wordCount.value = _wordCount;
        characterCount.value = _characterCount;
        selectCount.value = ContextUtil.Line.countSelect(focusText);
        focusRow.value = (selection as [number[], number[]])[1][0];
        focusCol.value = (selection as [number[], number[]])[1][1];
        // 更新行
        const getter = ContextUtil.Line.count(mdEditor, selection, prevIndexMap, oldLineCount);
        prevIndexMap = getter.prevIndexMap;       // 更新空行补齐的集合
        if (characterCount.value !== _characterCount || 
            oldLineCount !== getter.oldLineCount) {
            // 更新搜索内容
            doSearch();
        }
        oldLineCount = getter.oldLineCount;       // 更新总行数
        const fragment = getter.newLineContainer; // 更新行容器
        if (fragment) {
            lineNumberDOM.innerHTML = '';
            lineNumberDOM.appendChild(fragment);
        }
        // 更新内存文本
        if (autoSave.value) { // 需要自动保存
            const markdown = instance.getMarkdown();
            if (props.raw !== markdown) {
                emit('update:raw', markdown);
                emit('update:content', markdown);
                emit("update", markdown);
            }
        }
    }
    useUpdate();
    // 监听内容区域的宽度变化
    ContextUtil.onResize(mdEditor, useUpdate, doSearch);
    // 渲染代码块
    renderCodeBlock();
    
    locateSearchResultAt = (isDown: boolean): void => {
        if (searchResult.value.total === 0) return;
        const length = searchResult.value.list.length;
        const fixLength = (document.getElementById("amber-search--input") as HTMLInputElement).value!.length;
        let awaitArr: number[] = [];
        let selectedIndex = isDown ? length - 1 : 0;
        for (let index = 0; index < length; index++) {
            const selection = instance.getSelection();
            const searchLength = searchCondition.value.regular
                ? searchResult.value.list[index][3] - searchResult.value.list[index][1] : fixLength;
            const row = searchResult.value.list[index];
            let diffRow: number = row[0]; // 行间距
            let diffCol: number = row[1]; // 列间距
            // 如果是正则的向上查找并且row[0]和row[2]不相同
            // 那么focusRow和focusCol应该通过window.getSelection()来重新定位起始位置
            let rowToSubtract = focusRow.value;
            let colToSubtract = focusCol.value;
            if (!isDown && (row[0] !== row[2]) && searchCondition.value.regular) {
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
                    awaitArr = searchResult.value.list[target];
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
                    awaitArr = searchResult.value.list[target];
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
            awaitArr = searchResult.value.list[selectedIndex];
        }
        searchResult.value.hoverOn = selectedIndex + 1;
        highlightResult(awaitArr);
    }
    const editorElem: HTMLDivElement = document.getElementsByClassName("toastui-editor md-mode")[0] as HTMLDivElement;
    const previewElem: HTMLDivElement = document.querySelectorAll(".toastui-editor-md-preview .toastui-editor-contents")[0] as HTMLDivElement;
    let isProgrammaticScroll = false;
    const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
        const scale = target.scrollHeight / source.scrollHeight;
        const newScrollTop = source.scrollTop * scale;
        isProgrammaticScroll = true;
        target.scrollTop = newScrollTop;
    }
    editorElem.addEventListener('scroll', () => {
        if (isProgrammaticScroll) return;
        syncScroll(editorElem, previewElem);
        setTimeout(() => { isProgrammaticScroll = false; }, 0);
    });
    previewElem.addEventListener('scroll', () => {
        if (isProgrammaticScroll) return;
        syncScroll(previewElem, editorElem);
        setTimeout(() => { isProgrammaticScroll = false; }, 0);
    });
    renderMermaid();
    
    // 事件更新驱动
    instance.on('caretChange', () => { useUpdate(); });
    instance.on('updatePreview', () => { renderCodeBlock(); });
    instance.on('afterPreviewRender', () => { renderMermaid(); });
});

document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        searchEnable.value = true;
        doSearch();
    }
});
</script>

<style>
    @import "@toast-ui/editor/dist/toastui-editor.css";
    @import "@fortawesome/fontawesome-free/css/all.min.css";
    @import "katex/dist/katex.min.css";
    @import "@/css/EditorStyle.css";
</style>
