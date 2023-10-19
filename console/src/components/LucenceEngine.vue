<template>
    <section :data-theme="LucenceCore.cache.value.theme"
             class="lucence-wrapper">
        <div id="toast-editor"></div>
        <!-- Lucence BottomBar Module -->
        <div class="toolbar-stat-panel unselectable">
            <div @click="core.toggle.plugin.open()" class="stat-head">
                <i class="fa-solid fa-vector-square"></i>
            </div>
            <div class="stat-panel">
                <div class="stat-panel--left">
                    <span class="stat-panel--key">
                        <i style="position: relative;top: -1px;font-size: 12px;" 
                           class="fa-solid fa-gear">
                        </i>
                        设置
                    </span>
                    <span class="stat-panel--key" @click="core.toggle.search()">
                        <i style="position: relative;top: -1px;font-size: 12px;" 
                           class="fa-solid fa-magnifying-glass">
                        </i>
                        查找
                    </span>
                    <span class="stat-panel--key" @click="core.toggle.autoSave()">
                        <i style="position: relative;top: -1px;font-size: 12px;" 
                           class="fa-solid fa-floppy-disk">
                        </i>
                        {{ LucenceCore.cache.value.feature.autoSave ? '自动' : '手动' }}保存
                    </span>
                </div>
                <div class="stat-panel--right">
                    <span class="stat-panel--key">
                        行 {{ LucenceCore.cache.value.feature.focus.row }}, 列 {{ LucenceCore.cache.value.feature.focus.col }}{{ LucenceCore.cache.value.feature.count.selected ? ` (已选择${LucenceCore.cache.value.feature.count.selected})` : '' }}
                    </span>
                    <span class="stat-panel--key">
                        字词 {{ LucenceCore.cache.value.feature.count.words }}, 字符 {{ LucenceCore.cache.value.feature.count.characters }}
                    </span>
                    <span class="stat-panel--key">
                        <i style="position: relative;top: -1px;font-size: 12px;" 
                           class="fa-solid fa-terminal">
                        </i>
                        Markdown
                    </span>
                    <span class="stat-panel--key" @click="core.toggle.preview()">
                        <i class="fa-solid" 
                           style="margin-right: 0;" 
                           :class="LucenceCore.cache.value.feature.preview ? 'fa-eye' : 'fa-eye-slash'">
                        </i>
                    </span>
                    <span class="stat-panel--key last">
                        <a href="https://github.com/DioxideCN/Tool-Bench" 
                           target="_blank">
                            <i class="fa-brands fa-github"></i>
                        </a>
                    </span>
                </div>
            </div>
        </div>
        <!-- Amber Search Engine -->
        <div id="amber-popup--group" 
             class="amber-popup">
            <div class="amber-popup--search" 
                 :style="'display:' + (LucenceCore.cache.value.feature.search.enable ? 'flex' : 'none')">
                <div class="amber-popup--width_expander"></div>
                <div class="amber-popup--expander amber-popup--padding"
                     @click="core.toggle.replacing()">
                    <i class="codicon" 
                       :class="LucenceCore.cache.value.feature.search.replace ? 'codicon-chevron-down' : 'codicon-chevron-right'"></i>
                </div>
                <div class="amber-popup--padding">
                    <div class="amber-popup--ahead">
                        <div class="amber-popup--group">
                            <input @input="core.doSearch()" 
                                   id="amber-search--input" 
                                   type="text" 
                                   placeholder="查找" />
                            <i @click="core.toggle.capitalization()"
                               :class="LucenceCore.cache.value.feature.search.condition.capitalization ? 'active' : ''" 
                               class="codicon codicon-case-sensitive amber-popup--capitalization"
                               title="区分大小写">
                            </i>
                            <i @click="core.toggle.regular()" 
                               :class="LucenceCore.cache.value.feature.search.condition.regular ? 'active' : ''" 
                               class="codicon codicon-regex amber-popup--regular"
                               title="使用正则表达式">
                            </i>
                        </div>
                        <span class="amber-popup--result unselectable">
                            {{ LucenceCore.cache.value.feature.search.result.total === 0 ? '无结果' : ('第 ' + LucenceCore.cache.value.feature.search.result.hoverOn + ' 项, 共 ' + LucenceCore.cache.value.feature.search.result.total) + ' 项' }}
                        </span>
                        <div class="amber-popup--btn">
                            <i class="fa-solid fa-arrow-up amber-popup--last" 
                               :class="LucenceCore.cache.value.feature.search.result.total === 0 ? 'disable' : ''" 
                               @click="core.locateSearchResultAt(false)"
                               title="上一项">
                            </i>
                            <i class="fa-solid fa-arrow-down amber-popup--next" 
                               :class="LucenceCore.cache.value.feature.search.result.total === 0 ? 'disable' : ''" 
                               @click="core.locateSearchResultAt(true)"
                               title="下一项">
                            </i>
                            <i class="fa-solid fa-xmark amber-popup--close" 
                               @click="core.toggle.search()"
                               title="关闭搜索">
                            </i>
                        </div>
                    </div>
                    <div class="amber-popup--ahead amber-popup--replace" 
                         :style="'display:' + (LucenceCore.cache.value.feature.search.replace ? '' : 'none')">
                        <div class="amber-popup--group">
                            <input id="amber-search--replacing"
                                   type="text"
                                   placeholder="替换" />
                            <i @click="core.toggle.keepCap()"
                               class="codicon codicon-preserve-case amber-popup--capitalization"
                               :class="LucenceCore.cache.value.feature.search.condition.keepCap ? 'active' : ''"
                               title="保留大小写">
                            </i>
                        </div>
                        <!-- when there is no result we disable these btn -->
                        <i @click="core.doReplacing(false)"
                           class="codicon codicon-replace amber-popup--regular"
                           :class="LucenceCore.cache.value.feature.search.result.total === 0 ? 'disable' : ''"
                           title="替换">
                        </i>
                        <i @click="core.doReplacing(true)"
                           class="codicon codicon-replace-all amber-popup--regular"
                           :class="LucenceCore.cache.value.feature.search.result.total === 0 ? 'disable' : ''"
                           title="全部替换">
                        </i>
                    </div>
                </div>
            </div>
        </div>
        <!-- Lucence Extension Module -->
        <div id="lucence-plugin--store"
             @click="closeExtension()"
             v-if="LucenceCore.cache.value.plugin.enable">
            <div class="lucence-plugin--container"
                 @click.stop>
                <div class="lucence-plugin--head unselectable">
                    <div class="plugin-head--title">Extensions<span>扩展坞</span></div>
                    <div class="plugin-head--close">
                        <i class="fa-solid fa-xmark closable" 
                           @click="closeExtension()"></i>
                    </div>
                </div>
                <div class="lucence-plugin--body">
                    <div class="lucence-plugin--list">
                        <div class="lucence-plugin--card"
                             v-for="(plugin, index) in core.plugins.value" 
                             :key="index"
                             @click="switchViewPlugin(index)"
                             :class="pluginStore.activeOn===index?'active':''">
                            <div class="left-column">
                                <img :alt="plugin.key" 
                                     :src="plugin.detail.icon" 
                                     width="46" 
                                     height="46" />
                            </div>
                            <div class="right-column">
                                <p class="plugin-info--title">
                                    {{ plugin.detail.display }}
                                </p>
                                <p class="plugin-info--simple">
                                    版本：{{ plugin.detail.version }}&ensp;作者：{{ plugin.detail.author }}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="lucence-plugin--detail">
                        <div class="plugin-detail--head">
                            <p class="plugin-detail--title">
                                {{ core.plugins.value[pluginStore.activeOn].detail.display }}
                                <span>
                                    {{ core.plugins.value[pluginStore.activeOn].detail.version }}
                                </span>
                            </p>
                            <div class="plugin-detail--subject">
                                <span>Extension ID：{{ core.plugins.value[pluginStore.activeOn].key }}</span>
                                <span>Author：{{ core.plugins.value[pluginStore.activeOn].detail.author }}</span>
                                <span>
                                    <a :href="core.plugins.value[pluginStore.activeOn].detail.github"
                                   target="_blank">
                                        <i class="fa-brands fa-github"></i>&nbsp;&nbsp;GitHub Page
                                    </a>
                                </span>
                            </div>
                            <div v-if="core.plugins.value[pluginStore.activeOn].key !== 'default_extension'" 
                                 class="action-container">
                                <ul class="action-list">
                                    <li class="action-item" title="禁用此插件">
                                        <a class="action-label">禁用</a>
                                        <div class="action-separator">
                                            <div></div>
                                        </div>
                                        <div class="action-icon">
                                            <i class="fa-solid fa-ban"></i>
                                        </div>
                                    </li>
                                    <li class="action-item" title="卸载此插件">
                                        <a class="action-label">卸载</a>
                                        <div class="action-separator">
                                            <div></div>
                                        </div>
                                        <div class="action-icon">
                                            <i class="fa-solid fa-trash-can"></i>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="plugin-detail--body">
                            <div class="detail-bar">
                                <ul class="view-bar">
                                    <li class="bar-item" 
                                        :class="pluginStore.actionOn === 0 ? 'active' : ''"
                                        @click="pluginStore.actionOn = 0"
                                        title="查看该扩展的概览">
                                        概览
                                    </li>
                                    <li class="bar-item"
                                        :class="pluginStore.actionOn === 1 ? 'active' : ''"
                                        @click="pluginStore.actionOn = 1"
                                        title="查看该扩展的配置项">
                                        配置项
                                    </li>
                                    <li class="bar-item"
                                        :class="pluginStore.actionOn === 2 ? 'active' : ''"
                                        @click="pluginStore.actionOn = 2"
                                        title="查看该扩展的注册项">
                                        注册项
                                    </li>
                                </ul>
                            </div>
                            <div class="bar-item--detail">
                                <template v-if="pluginStore.actionOn === 0">
                                    {{ core.plugins.value[pluginStore.activeOn].detail.description }}
                                </template>
                                <template v-else-if="pluginStore.actionOn === 1">
                                    配置
                                </template>
                                <template v-else-if="pluginStore.actionOn === 2">
                                    <ul class="ext-list--body">
                                        <li class="ext-list--column" 
                                            @click="switchActionOpen(0)">
                                            <div class="ext-list--title">
                                                <i class="fa-solid" :class="pluginStore.actionOpen[0]?'fa-caret-down':'fa-caret-right'"></i>工具栏（共{{ core.plugins.value[pluginStore.activeOn].register.toolbar.length }}项）
                                            </div>
                                            <table @click.stop 
                                                   class="ext-list--child_list"
                                                   :style="'display:'+(pluginStore.actionOpen[0]?'':'none')">
                                                <thead>
                                                    <tr>
                                                        <th>扩展Key</th>
                                                        <th>工具ID</th>
                                                        <th>工具名称</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="(item, index) in core.plugins.value[pluginStore.activeOn].register.toolbar" :key="index">
                                                        <td><code>{{ item.key }}</code></td>
                                                        <td>{{ item.name }}</td>
                                                        <td>{{ item.tooltip }}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </li>
                                        <li class="ext-list--column"
                                            @click="switchActionOpen(1)">
                                            <div class="ext-list--title">
                                                <i class="fa-solid" :class="pluginStore.actionOpen[1]?'fa-caret-down':'fa-caret-right'"></i>命令（共{{ core.plugins.value[pluginStore.activeOn].register.command.length }}项）
                                            </div>
                                            <table @click.stop 
                                                   class="ext-list--child_list"
                                                   :style="'display:'+(pluginStore.actionOpen[1]?'':'none')">
                                                <thead>
                                                    <tr>
                                                        <th>扩展Key</th>
                                                        <th>命令名称</th>
                                                        <th>返回类型</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="(item, index) in core.plugins.value[pluginStore.activeOn].register.command" :key="index">
                                                        <td><code>{{ item.key }}</code></td>
                                                        <td>{{ item.name }}</td>
                                                        <td><code>{{ item.returnType }}</code></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </li>
                                        <li class="ext-list--column"
                                            @click="switchActionOpen(2)">
                                            <div class="ext-list--title">
                                                <i class="fa-solid" :class="pluginStore.actionOpen[2]?'fa-caret-down':'fa-caret-right'"></i>事件（共{{ core.plugins.value[pluginStore.activeOn].register.event.length }}项）
                                            </div>
                                            <table @click.stop 
                                                   class="ext-list--child_list"
                                                   :style="'display:'+(pluginStore.actionOpen[2]?'':'none')">
                                                <thead>
                                                    <tr>
                                                        <th>扩展Key</th>
                                                        <th>监听类型</th>
                                                        <th>描述</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="(item, index) in core.plugins.value[pluginStore.activeOn].register.event" :key="index">
                                                        <td><code>{{ item.key }}</code></td>
                                                        <td>{{ item.eventType }}</td>
                                                        <td>{{ item.desc }}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </li>
                                    </ul>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { LucenceCore } from "@/core/LucenceCore";

const emit = defineEmits<{
    (event: "update:raw",     value: string): void;
    (event: "update:content", value: string): void;
    (event: "update",         value: string): void;
}>();
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
let core: LucenceCore;
const pluginStore = ref({
    activeOn: 0,
    actionOn: 0,
    actionOpen: [true, true, true]
});
function closeExtension(): void {
    core.toggle.plugin.close();
    pluginStore.value.activeOn = 0;
    pluginStore.value.actionOn = 0;
    pluginStore.value.actionOpen = [true, true, true];
}
function switchActionOpen(index: number): void {
    pluginStore.value.actionOpen[index] = !pluginStore.value.actionOpen[index];
}
function switchViewPlugin(index: number): void {
    pluginStore.value.activeOn = index;
    pluginStore.value.actionOn = 0;
}
onMounted(async () => {
    // 回显暴露的核心
    core = new LucenceCore(props.raw).build(function (): void {
        emit('update:raw', core.editor.getMarkdown());
        emit('update:content', core.editor.getHTML());
        emit('update', core.editor.getHTML());
    });
})
</script>

<style>
    @import "@vscode/codicons/dist/codicon.css";
    @import "@toast-ui/editor/dist/toastui-editor.css";
    @import "@fortawesome/fontawesome-free/css/all.min.css";
    @import "katex/dist/katex.min.css";
    @import "@/css/EditorStyle.css";
</style>
