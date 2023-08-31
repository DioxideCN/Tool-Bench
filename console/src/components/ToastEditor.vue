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
            设置
          </span>
          <span class="stat-panel--key" @click="switchAutoSave()">
            {{ autoSave ? '自动保存' : '手动保存' }}
          </span>
        </div>
        <div class="stat-panel--right">
          <span class="stat-panel--key">
            行 {{ focusRow }}{{ selectCount ? ` (已选择${selectCount})` : '' }}
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

const previewEnable = ref(true); // 启用预览
const autoSave = ref(true);      // 自动保存
const wordCount = ref(0);        // 词数
const characterCount = ref(0);   // 字符数
const selectCount = ref(0);      // 已选择
const focusRow = ref(1);         // 聚焦行数
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

function switchAutoSave(): void {
  autoSave.value = !autoSave.value;
}
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

const emit = defineEmits<{
  (event: "update:raw", value: string): void;
  (event: "update:content", value: string): void;
  (event: "update", value: string): void;
}>();

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
        {
          name: 'tool-emoji',
          tooltip: '表情',
          className: 'fa-solid fa-face-laugh-wink',
          popup: {
            body: (() => {
              function closeCallback() {
                instance.eventEmitter.emit('closePopup');
              }
              const emojiElement = PopupBuilder.UseRegular.emoji(
                  function callback(emoji: string) {
                    closeCallback();
                    insertEmoji(emoji);
                  },
                  ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','😘','😗','😙','😚','😋','😛','😝','😜','🤓','😎','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','😢','😭','😤','😠','😡','😳','😱','😨','🤗','🤔','😶','😑','😬','🙄','😯','😴','😷','🤑','😈','🤡','💩','👻','💀','👀','👣','👐','🙌','👏','🤝','👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤘','👌','👈','👉','👆','👇','☝️','✋','🤚','🖐','🖖','👋','🤙','💪','🖕','✍️','🙏']
              );
              return PopupBuilder.build('表情', closeCallback, emojiElement);
            })(),
            className: 'popup-tool-image',
            style: {},
          },
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
  
  function insertEmoji(emoji: string): boolean {
    if (emoji) {
      const [start, end] = instance.getSelection();
      console.log([start, end])
      // @ts-ignore
      instance.replaceSelection(emoji, [start[0], start[0] - emoji.length], end - 1);
    }
    return false;
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
  editorArea.insertBefore(lineNumberDOM, editorArea.childNodes[0]);
  function useUpdate() {
    // 更新统计
    const { _wordCount, _characterCount } = ContextUtil.countWord(instance.getMarkdown());
    wordCount.value = _wordCount;
    characterCount.value = _characterCount;
    selectCount.value = ContextUtil.Line.countSelect(instance.getMarkdown(), instance.getSelection());
    // 更新行
    const getter = ContextUtil.Line.count(mdEditor, instance.getSelection(), prevIndexMap, oldLineCount);
    prevIndexMap = getter.prevIndexMap; // 更新空行补齐的集合
    oldLineCount = getter.oldLineCount; // 更新总行数
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
  
  instance.on('caretChange', () => {
    useUpdate();
    // 计算是否有选择内容
    const [start, end] = instance.getSelection();
  });

  // 监听内容区域的宽度变化
  ContextUtil.onResize(mdEditor, useUpdate);
});
</script>

<style>
  @import "@toast-ui/editor/dist/toastui-editor.css";
  @import "@fortawesome/fontawesome-free/css/all.min.css";
  @import "../css/EditorStyle.css";
</style>
