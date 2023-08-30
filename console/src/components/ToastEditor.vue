<template>
  <section :data-theme="currentTheme" class="toast-wrapper">
    <div id="toast-editor"></div>
    <div class="toolbar-stat-panel">
      <div class="stat-head">
        <i class="fa-solid fa-plug"></i>
      </div>
      <div class="stat-panel">
        <div class="stat-panel--left">
        </div>
        <div class="stat-panel--right">
          <span class="stat-panel--key">
            {{ wordCount }} 字词&nbsp;&nbsp;{{ characterCount }} 字符
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
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import Editor from "@toast-ui/editor";
import { PopupBuilder } from "@/util/PopupBuilder";
import { ContextUtil } from "@/util/ContextUtil";

// 编辑器主题
function getTheme(): string {
  let theme = localStorage.getItem('editor-theme');
  if (!theme) {
    theme = 'light';
    localStorage.setItem('editor-theme', theme);
  }
  return theme;
}

const previewEnable = ref(true);
const wordCount = ref(0); // 词数
const characterCount = ref(0); // 字符数
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

function switchPreview() {
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
    previewHighlight: false,
    toolbarItems: [
      [
        {
          name: 'tool-head',
          tooltip: '标题',
          className: 'fa-solid fa-heading',
          state: 'heading',
          popup: {
            body: (() => {
              function closeCallback() {
                instance.eventEmitter.emit('closePopup');
              }
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
    const highlightRowNum = highlightLine();
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
      updateLineNumber(currLineNumber, indexMap); // 更新行容器
      prevIndexMap = indexMap;
      lineNumber = currLineNumber;
    } else {
      // 更新聚焦行
      const lineNumber: number = highlightLine();
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
  }, 10);
  countLines();
  
  // 更新文本
  function updateContext(): void {
    const markdown = instance.getMarkdown();
    if (props.raw !== markdown) {
      emit('update:raw', markdown);
      emit('update:content', markdown);
      emit("update", markdown);
    }
  }
  
  instance.on('caretChange', () => {
    const { _wordCount, _characterCount } = ContextUtil.countWord(instance.getMarkdown());
    wordCount.value = _wordCount;
    characterCount.value = _characterCount;
    countLines();
    updateContext();
  });
  
  function highlightLine(): number {
    const selection = window.getSelection();
    if (!selection) return -1;
    let someNode = selection.anchorNode;
    if (!someNode) return -1;
    if (someNode.nodeType === 3) {
      someNode = someNode.parentNode;
    }
    if (!someNode) return -1;
    const parentNode = someNode.parentNode;
    if (!parentNode) return -1;
    return Array.prototype.indexOf.call(parentNode.childNodes, someNode) + 1;
  }
});
</script>

<style>
@import "@toast-ui/editor/dist/toastui-editor.css";
@import "@fortawesome/fontawesome-free/css/all.min.css";
@import "../css/EditorStyle.css";
</style>
