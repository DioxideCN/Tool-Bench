import type { Editor } from "@toast-ui/editor";
import type { ToolbarItemOptions } from "@toast-ui/editor/types/ui";

export abstract class AbstractPlugin {
    protected readonly instance: Editor;

    constructor(instance: Editor) {
        this.instance = instance;
    }

    /**
     * 创建插件的Toolbar项目
     */
    abstract createToolbar(): PluginToolbar;

    /**
     * 创建插件需要使用到的commands
     */
    abstract createCommands(): void;
}

export type PluginToolbar = {
    append: 'start' | 'end',
    items: ToolbarItemOptions[],
}
