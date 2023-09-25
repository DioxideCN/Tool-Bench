<template>
    <section :data-theme="LucenceCore.cache.value.theme"
             class="toast-wrapper">
        <div id="toast-editor"></div>
        <div class="toolbar-stat-panel">
            <div class="stat-head">
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
    </section>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { LucenceCore } from "@/core/LucenceCore";

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
onMounted(async () => {
    // 回显暴露的核心
    core = new LucenceCore(props.raw).build();
})
</script>

<style>
    @import "@toast-ui/editor/dist/toastui-editor.css";
    @import "@fortawesome/fontawesome-free/css/all.min.css";
    @import "katex/dist/katex.min.css";
    @import "@/css/EditorStyle.css";
</style>
