import type {ToolbarItemOptions} from "@toast-ui/editor/types/ui";
import type {CommandFn} from "@toast-ui/editor/types/plugin";

export type PluginToolbar = {
    append: 'start' | 'end',
    items: ToolbarItemOptions[],
}

export type PluginCommand = {
    name: string,
    command: CommandFn,
}

export type PluginDetail = {
    icon: string,
    name: string,
    display: string,
    author: string,
    version: string,
    description: string,
    github: string,
}

export type PluginList = PluginDetail[];

export type PluginEvent = 
    // 文本事件
    "content_input"      |
    "content_delete"     |
    "content_select"     |
    "content_change"     |
    "content_cursor"     |
    // 渲染事件
    "render_html"        |
    "render_code"        |
    "render_latex"       |
    "render_mermaid"     |
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
    callback: EventHandler,
};
export type PluginEventConverter = {
    source: string,
    callback: EventHandler,
}
