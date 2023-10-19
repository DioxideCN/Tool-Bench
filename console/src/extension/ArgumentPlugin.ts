import type {ToolbarItemOptions} from "@toast-ui/editor/types/ui";
import type {CommandFn} from "@toast-ui/editor/types/plugin";
import type {Stack} from "@/core/BasicStructure";

export type PluginToolbar = {
    append: 'start' | 'end',
    items: ToolbarItemOptions[],
}

export type PluginCommand = {
    name: string,
    command: CommandFn,
}

/**
 * 暴露给第三方开发者的插件信息定义类型
 */
export type PluginDetail = {
    icon: string,
    name: string,
    display: string,
    author: string,
    version: string,
    description: string,
    github: string,
}
/**
 * 扩展槽的信息统计
 */
export type PluginHolder = {
    key: string,
    detail: PluginDetail,
    register: {
        toolbar: {
            key: string,
            name: string,
            tooltip: string,
        }[],
        command: {
            key: string,
            name: string,
            returnType: string,
        }[],
        event: {
            key: string,
            eventType: PluginEvent,
            desc: string | undefined,
        }[],
    }
}
export type PluginList = Stack<PluginHolder>;

export type PluginEvent = 
    // 文本事件
    "content_input"      |
    "content_delete"     |
    "content_select"     |
    "content_change"     |
    // 渲染事件
    "render_latex"       |
    "render_mermaid"     |
    "render_code"        |
    "render_html"        |
    // 檢索事件
    "search_text"        |
    "search_regex"       |
    "search_next"        |
    "search_prev"        |
    // 切換事件
    "switch_autosave"    |
    "switch_search"      |
    "switch_preview"     |
    // 其它事件
    "window_resize"      |
    "theme_change";

export type EventHandler = () => void;
export type PluginEventDefinition = {
    type: PluginEvent,
    desc: string | undefined,
    callback: EventHandler,
};
export type PluginEventConverter = {
    source: string,
    callback: EventHandler,
}
