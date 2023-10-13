<template>
    <section :data-theme="LucenceCore.cache.value.theme"
             class="lucence-wrapper">
        <div id="toast-editor"></div>
        <!-- Lucence BottomBar Module -->
        <div class="toolbar-stat-panel">
            <div @click="core.toggle.plugin.open()" class="stat-head">
                <i class="fa-solid fa-plug"></i>
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
                 :style="'display:' + (LucenceCore.cache.value.feature.search.enable ? 'block' : 'none')">
                <div class="amber-popup--ahead">
                    <div class="amber-popup--group">
                        <input @input="core.doSearch()" 
                               id="amber-search--input" 
                               type="text" 
                               placeholder="查找" />
                        <i @click="core.toggle.capitalization()"
                           :class="LucenceCore.cache.value.feature.search.condition.capitalization ? 'active' : ''" 
                           class="fa-solid fa-a amber-popup--capitalization">
                        </i>
                        <i @click="core.toggle.regular()" 
                           :class="LucenceCore.cache.value.feature.search.condition.regular ? 'active' : ''" 
                           class="fa-solid fa-asterisk amber-popup--regular">
                        </i>
                    </div>
                    <span class="amber-popup--result">
                        {{ LucenceCore.cache.value.feature.search.result.total === 0 ? '无结果' : ('第 ' + LucenceCore.cache.value.feature.search.result.hoverOn + ' 项, 共 ' + LucenceCore.cache.value.feature.search.result.total) + ' 项' }}
                    </span>
                    <div class="amber-popup--btn">
                        <i class="fa-solid fa-arrow-up amber-popup--last" 
                           :class="LucenceCore.cache.value.feature.search.result.total === 0 ? 'disable' : ''" 
                           @click="core.locateSearchResultAt(false)">
                        </i>
                        <i class="fa-solid fa-arrow-down amber-popup--next" 
                           :class="LucenceCore.cache.value.feature.search.result.total === 0 ? 'disable' : ''" 
                           @click="core.locateSearchResultAt(true)">
                        </i>
                        <i class="fa-solid fa-xmark amber-popup--close" 
                           @click="core.toggle.search()">
                        </i>
                    </div>
                </div>
            </div>
        </div>
        <!-- Lucence Plugin Module -->
        <div id="lucence-plugin--store"
             @click="core.toggle.plugin.close()"
             v-if="LucenceCore.cache.value.plugin.enable">
            <div class="lucence-plugin--container"
                 @click.stop>
                <div class="lucence-plugin--head">
                    <div class="plugin-head--title">Plugins<span>插件</span></div>
                    <div class="plugin-head--close">
                        <i class="fa-solid fa-xmark closable" 
                           @click="core.toggle.plugin.close()"></i>
                    </div>
                </div>
                <div class="lucence-plugin--body">
                    <div class="lucence-plugin--list">
                        <div class="lucence-plugin--card"
                             v-for="(plugin, index) in core.plugins.value" 
                             :key="index"
                             @click="pluginStore.activeOn=index"
                             :class="pluginStore.activeOn===index?'active':''">
                            <div class="left-column">
                                <img :alt="plugin.name" 
                                     :src="plugin.icon" 
                                     width="46" 
                                     height="46" />
                            </div>
                            <div class="right-column">
                                <p class="plugin-info--title">
                                    {{ plugin.display }}
                                </p>
                                <p class="plugin-info--simple">
                                    版本：{{ plugin.version }}
                                    <br>
                                    作者：{{ plugin.author }}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="lucence-plugin--detail">
                        <div class="plugin-detail--head">
                            <p class="plugin-detail--title">
                                {{ core.plugins.value[pluginStore.activeOn].display }}
                                <span>
                                    {{ core.plugins.value[pluginStore.activeOn].version }}
                                </span>
                            </p>
                            <div class="plugin-detail--subject">
                                <span>Plugin ID：{{ core.plugins.value[pluginStore.activeOn].name }}</span>
                                <span>作者：{{ core.plugins.value[pluginStore.activeOn].author }}</span>
                                <span>
                                    <a :href="core.plugins.value[pluginStore.activeOn].github"
                                   target="_blank">
                                        <i class="fa-brands fa-github"></i>&nbsp;&nbsp;GitHub Page
                                    </a>
                                </span>
                            </div>
                            <div v-if="core.plugins.value[pluginStore.activeOn].name !== 'default_plugin'" 
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
                                    <li class="bar-item active" 
                                        title="概览">
                                        概览
                                    </li>
                                    <li class="bar-item"
                                        title="配置">
                                        配置
                                    </li>
                                </ul>
                            </div>
                            <div class="bar-item--detail">
                                {{ core.plugins.value[pluginStore.activeOn].description }}
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
    (event: "update:raw", value: string): void;
    (event: "update:content", value: string): void;
    (event: "update", value: string): void;
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
});
onMounted(async () => {
    // 回显暴露的核心
    core = new LucenceCore(props.raw).build((): void => {
        console.log('call content change event...');
        emit('update:raw', core.editor.getMarkdown());
        emit('update:content', core.editor.getMarkdown());
        emit('update', core.editor.getMarkdown());
    });
})
</script>

<style>
    @import "@toast-ui/editor/dist/toastui-editor.css";
    @import "@fortawesome/fontawesome-free/css/all.min.css";
    @import "katex/dist/katex.min.css";
    @import "@/css/EditorStyle.css";
</style>
