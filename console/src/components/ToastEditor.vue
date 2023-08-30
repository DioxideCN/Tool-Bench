<template>
  <section :data-theme="currentTheme" class="toast-wrapper">
    <div id="toast-editor"></div>
    <div class="toolbar-stat-panel">
      <div class="stat-head">
        <i class="fa-solid fa-code"></i>
      </div>
      <div class="stat-panel">
        <div class="stat-panel--left">
          <span class="stat-panel--key">
            <i class="fa-solid fa-language"></i> Markdown
          </span>
        </div>
        <div class="stat-panel--right">
          <span class="stat-panel--key">
            <i class="fa-solid fa-code"></i> Markdown
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import Editor from "@toast-ui/editor";

// 编辑器主题
function getTheme(): string {
  let theme = localStorage.getItem('editor-theme');
  if (!theme) {
    theme = 'light';
    localStorage.setItem('editor-theme', theme);
  }
  return theme;
}

const currentTheme = ref(getTheme());
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

const emit = defineEmits<{
  (event: "update:raw", value: string): void;
  (event: "update:content", value: string): void;
  (event: "update", value: string): void;
}>();

onMounted(async () => {
  // 初始化Toast编辑器
  let lineNumber: number = 1;
  let prevIndexMap = new Map<number, number>();
  const instance: Editor = new Editor({
    el: document.querySelector('#toast-editor')!,
    previewStyle: 'vertical',
    height: 'calc(100% - 30px)',
    placeholder: '请输入内容...',
    hideModeSwitch: true,
    toolbarItems: [
      [
        {
          name: 'tool-head',
          tooltip: '标题',
          command: 'bold',
          className: 'fa-solid fa-heading',
          state: 'heading',
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
        },
        {
          name: 'tool-link',
          tooltip: '链接',
          className: 'fa-solid fa-link',
        },
        {
          name: 'tool-image',
          tooltip: '图片',
          className: 'fa-solid fa-image',
        },
      ],
    ],
  });

  function updateToolbarItem(theme: string) {
    instance.removeToolbarItem(`tool-theme-${theme === 'light' ? 'moon' : 'day'}`);
    instance.insertToolbarItem({ groupIndex: 0, itemIndex: 0 }, {
      name: `tool-theme-${theme === 'light' ? 'day' : 'moon'}`,
      tooltip: `切换至${theme === 'light' ? '夜间' : '白天'}`,
      command: 'switchTheme',
      className: `fa-solid fa-${theme === 'light' ? 'sun' : 'moon'}`,
    });
  }

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

  updateToolbarItem(getTheme());
  instance.addCommand('markdown', 'switchTheme', () => switchTheme());
  // 恢复缓存
  instance.setMarkdown(props.raw);

  // 构造行数容器
  const editorArea: Element = document.getElementsByClassName('toastui-editor md-mode')[0];
  const mdEditor: Element = editorArea.getElementsByClassName('ProseMirror')[0];
  const lineNumberDOM = document.createElement('div');
  lineNumberDOM.className = 'editor-line-number';
  lineNumberDOM.innerHTML = '<div class="line-item">1</div>';
  editorArea.insertBefore(lineNumberDOM, editorArea.childNodes[0]);

  function throttle(fn: Function, delay: number) {
    let lastCall = 0;
    return function (...args: any[]) {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return fn(...args);
    };
  }
  
  // 更新行号
  function updateLineNumber(val: number,
                            markMap: Map<number, number>): void {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < val; i++) {
      const newLineItem = document.createElement("div");
      newLineItem.className = "line-item";
      newLineItem.textContent = (i+1).toString();
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
    lineNumberDOM.innerHTML = '';
    lineNumberDOM.appendChild(fragment);
  }
  
  // 节流行数监听器
  const countLines = throttle(() => {
    const indexMap: Map<number, number> = new Map();
    const currLineNumber: number = mdEditor.childNodes.length;
    mdEditor.childNodes.forEach((childNode, index) => {
      // @ts-ignore
      const height = childNode.clientHeight || childNode.offsetHeight;
      const tempCounter = Math.ceil(height / 27);
      if (tempCounter > 1) {
        indexMap.set(index, tempCounter - 1);
      }
    })
    if (JSON.stringify(Array.from(indexMap)) !== JSON.stringify(Array.from(prevIndexMap)) || lineNumber !== currLineNumber) {
      updateLineNumber(currLineNumber, indexMap);
      prevIndexMap = indexMap;
      lineNumber = currLineNumber;
    }
  }, 10);
  countLines();
  
  // 监听文本变化
  function updateContext(): void {
    const markdown = instance.getMarkdown();
    if (props.raw !== markdown) {
      emit('update:raw', markdown);
      emit('update:content', markdown);
      emit("update", markdown);
    }
  }
  const _interval = setInterval(() => {
    countLines();
    updateContext();
    if (!document.querySelector('#toast-editor')) {
      clearInterval(_interval);
    }
  }, 10);

});
</script>

<style>
@import "@toast-ui/editor/dist/toastui-editor.css";
@import "@fortawesome/fontawesome-free/css/all.min.css";

[data-theme="light"] {
  --editor-toolbar-main: #fff;
  --editor-toolbar-bg: #2c2c2c;
  --editor-toolbar-btn: rgb(185,185,185);
  --editor-toolbar-btn-hover: rgb(66,66,66);
  --editor-editor-left: #fff;
  --editor-preview-bg: rgb(243,243,243);
  --editor-border-color: #ebedf2;
  --display-p: #222;
  --display-quoto: rgba(0,0,0,.05);
  --display-border: #eaedf0;
  --editor-panel-bg: #fff;
  --default-highlight: rgb(173,214,255);
}

[data-theme="night"] {
  --editor-toolbar-main: #fff;
  --editor-toolbar-bg: rgb(24,24,24);
  --editor-toolbar-btn: rgb(185,185,185);
  --editor-toolbar-btn-hover: rgb(66,66,66);
  --editor-editor-left: rgb(31,31,31);
  --editor-preview-bg: rgb(24,24,24);
  --editor-border-color: rgb(38,38,38);
  --display-p: rgb(204,204,204);
  --display-quoto: rgba(110, 118, 129, 0.4);
  --display-border: #2c3135;
  --editor-panel-bg: rgb(24,24,24);
  --default-highlight: rgb(38,79,120);
}

.toolbar-stat-panel {
  display: flex;
  height: 30px;
  overflow: hidden;
  align-items: center;
}
.stat-head { 
  color: var(--editor-toolbar-main); 
  padding: 0 13px;
  height: 30px;
  display: flex;
  align-items: center;
  background: #007acc; 
}
.stat-panel {
  color: var(--display-p);
  display: flex;
  height: 30px;
  width: 100%;
  font-size: 15px;
  overflow: hidden;
  padding: 0 25px 0 10px;
  align-items: center;
  background: var(--editor-panel-bg);
  border-top: 2px solid var(--editor-border-color);
}
.stat-panel--left { justify-content: start; }
.stat-panel--right { justify-content: end; }
.stat-panel--right, .stat-panel--left { flex: 1; display: flex; }

.toastui-editor-md-preview .toastui-editor-contents h1 { 
  font-size: 2.3rem; 
  border-bottom: 1px solid var(--display-border)!important;
}
.toastui-editor-md-preview .toastui-editor-contents h2 { 
  font-size: 2rem; 
  border-bottom: 1px solid var(--display-border)!important; 
}
.toastui-editor-md-preview .toastui-editor-contents h3 { font-size: 1.7rem; border: none!important; }
.toastui-editor-md-preview .toastui-editor-contents h4 { font-size: 1.6rem; border: none!important; }
.toastui-editor-md-preview .toastui-editor-contents h5 { font-size: 1.3rem; border: none!important; }
.toastui-editor-md-preview .toastui-editor-contents h6 { font-size: 1.0rem; border: none!important; }

.toastui-editor-contents code,
.toastui-editor-contents pre,
.toastui-editor-md-preview .toastui-editor-contents blockquote {
  border-radius: 3px;
  background: var(--display-quoto);
}
.toastui-editor-md-code-block-line-background,
.toastui-editor-md-code.toastui-editor-md-marked-text,
.toastui-editor-md-code {
  background: none!important;
}

.toastui-editor-md-preview .toastui-editor-contents blockquote,
.toastui-editor-contents pre {
  padding: .8rem .8rem .6rem .8rem;
}
.toastui-editor-md-preview .toastui-editor-contents blockquote { border: none!important; }
.ProseMirror,
.toastui-editor-contents p,
.toastui-editor-md-preview .toastui-editor-contents blockquote,
.toastui-editor-md-block-quote .toastui-editor-md-marked-text, 
.toastui-editor-md-list-item .toastui-editor-md-meta,
.toastui-editor-md-preview .toastui-editor-contents h1,
.toastui-editor-md-preview .toastui-editor-contents h2,
.toastui-editor-md-preview .toastui-editor-contents h3,
.toastui-editor-md-preview .toastui-editor-contents h4,
.toastui-editor-md-preview .toastui-editor-contents h5,
.toastui-editor-md-preview .toastui-editor-contents h6,
.toastui-editor-contents code,
.toastui-editor-md-table .toastui-editor-md-table-cell,
.toastui-editor-md-code.toastui-editor-md-marked-text { 
  color: var(--display-p);
  letter-spacing: 1px;
}
.toastui-editor-main .toastui-editor-md-splitter { 
  background-color: var(--editor-border-color)!important;
  width: 2px;
}
.toastui-editor-toolbar { height: 47px!important; }
.toastui-editor-defaultUI { border: none!important; }
.toastui-editor-defaultUI-toolbar {
  background: var(--editor-toolbar-bg);
  font-size: 16px;
  border-radius: 0!important;
  padding: 1px 15px!important;
  height: 47px!important;
  border-bottom: 2px solid var(--editor-border-color)!important;
}

.toastui-editor-toolbar-group-tail { display: flex; }
.toastui-editor-defaultUI-toolbar .toastui-editor-toolbar-group { flex-grow: 1; }
.toastui-editor-defaultUI-toolbar button {
  color: var(--editor-toolbar-btn);
  border: none!important;
}
.toastui-editor-defaultUI-toolbar button.fa-solid.fa-moon,
.toastui-editor-defaultUI-toolbar button.fa-solid.fa-sun {
  background: #007acc;
  color: #fff;
}

.toastui-editor-defaultUI-toolbar button:not(:disabled):hover {
  color: var(--editor-toolbar-main);
  background-color: var(--editor-toolbar-btn-hover);
  border: none!important;
}

.toastui-editor-md-container .toastui-editor { background: var(--editor-editor-left); display: flex; }
.toastui-editor-md-container .toastui-editor-md-preview { 
  color: var(--display-p);
  background: var(--editor-preview-bg);
}

.toastui-editor-contents .task-list-item:before { top: 4px; }
.toastui-editor-md-container .toastui-editor-md-preview .toastui-editor-contents,
.toastui-editor-md-heading1,
.toastui-editor-md-heading2,
.toastui-editor-md-heading3,
.toastui-editor-md-heading4,
.toastui-editor-md-heading5,
.toastui-editor-defaultUI .ProseMirror {
  height: 100%;
  font-size: 18px;
  padding: 5px 10px 5px 0;
  overflow-y: unset;
  overflow-X: unset;
}
.toastui-editor-md-container .toastui-editor-md-preview .toastui-editor-contents {
  white-space: nowrap;
  word-wrap: break-word;
  word-break: break-all;
  padding: 5px 0!important;
}

.toastui-editor-defaultUI .ProseMirror { width: calc(100% - 76px); }
.toastui-editor-contents .toastui-editor-md-preview-highlight:after {
  background-color: transparent!important;
  padding: 5px 25px 5px 0!important;
}

.toastui-editor-md-container .toastui-editor::-webkit-scrollbar,
.toastui-editor-md-preview::-webkit-scrollbar {
  width: 10px;
}
.toastui-editor-md-container .toastui-editor::-webkit-scrollbar-button,
.toastui-editor-md-preview::-webkit-scrollbar-button {
  display: none;
}
.toastui-editor-md-container .toastui-editor::-webkit-scrollbar-track { background-color: var(--editor-editor-left); }
.toastui-editor-md-preview::-webkit-scrollbar-track { background-color: var(--editor-preview-bg); }
.toastui-editor-md-container .toastui-editor::-webkit-scrollbar-thumb,
.toastui-editor-md-preview::-webkit-scrollbar-thumb {
  background: var(--editor-border-color);
}

.toastui-editor-defaultUI-toolbar *,
.toastui-editor-md-container .toastui-editor,
.toastui-editor-main .toastui-editor-md-splitter,
.toastui-editor-md-container .toastui-editor-md-preview { transition: all .2s ease; }
.toastui-editor-md-container .toastui-editor {
  overflow-y: auto;
  overflow-X: hidden;
}
.editor-line-number {
  width: 76px;
  height: 100%;
  padding: 5px 18px 5px 0;
}
.editor-line-number::-webkit-scrollbar {
  display: none;
}
.editor-line-number .line-item {
  cursor: default;
  height: 27px;
  color: #6e7681;
  display: flex;
  align-items: center;
  justify-content: end;
  font-size: 18px;
  font-family: "Cascadia Code", "PingFang SC", Consolas, "Courier New", monospace, Consolas, "Courier New", monospace;
}

.toastui-editor-md-code-block-line-background.start, .toastui-editor-md-custom-block-line-background.start {
  margin-top: 0!important;
}

.toastui-editor-contents ul>li:before { margin-top: 12px; }

.toastui-editor-md-preview .toastui-editor-contents h1,
.toastui-editor-md-preview .toastui-editor-contents h2,
.toastui-editor-md-preview .toastui-editor-contents h3,
.toastui-editor-md-preview .toastui-editor-contents h4,
.toastui-editor-md-preview .toastui-editor-contents h5,
.toastui-editor-md-preview .toastui-editor-contents h6 {
  padding: 20px 0 0;
  margin: 0;
  line-height: 1.3;
}
.toastui-editor-contents p { line-height: 1.6; text-wrap: initial; }
.toastui-editor-contents blockquote,
.toastui-editor-contents pre,
.toastui-editor-contents p,
.toastui-editor-contents ol,
.toastui-editor-contents ul {
  margin: 1rem 0 0;
}

.toastui-editor-contents table {
  color: var(--display-p);
  font-size: 15px;
  margin: 1.5rem 0 0;
  display: block;
  overflow-x: auto;
  width: 100%;
  word-wrap: normal;
  border: none;
}
.toastui-editor-contents table thead th {
  color: var(--display-p);
  padding: .5rem;
  border: none;
  border-bottom: 2px solid var(--display-quoto);
  border-top: none;
  height: fit-content;
  background: transparent;
  font-weight: bold;
}
.toastui-editor-contents table tbody tr td {
  color: var(--display-p);
  width: 999px;
  padding: .5rem;
  text-align: left;
  height: fit-content;
  vertical-align: top;
  border: none;
  border-bottom: 1px solid var(--display-quoto);
  border-top: 1px solid var(--display-quoto);
  background: transparent;
}
.toastui-editor-contents table+* { margin-top: 2rem; }
.toastui-editor-contents table tbody tr td p {
  margin: 3px 0 0;
  text-align: left;
  line-height: 1.6;
  font-size: 16px;
}
.toastui-editor-contents th.toastui-editor-md-preview-highlight, 
.toastui-editor-contents td.toastui-editor-md-preview-highlight {
  color: var(--display-p);
  background-color: var(--default-highlight);
}
</style>
