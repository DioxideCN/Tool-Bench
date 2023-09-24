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
    author: string,
    version: string,
    description: string,
}
