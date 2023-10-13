import type {PluginCommand, PluginDetail, PluginList, PluginToolbar} from "@/extension/ArgumentPlugin";
import type { AbstractPlugin } from "@/extension/BasePlugin";
import {Stack} from "@/core/BasicStructure";
import type {ToolbarItemOptions} from "@toast-ui/editor/types/ui";
import type {LucenceCore} from "@/core/LucenceCore";
import {DefaultPlugin} from "@/plugin/DefaultPlugin";
import {TestPlugin} from "@/plugin/TestPlugin";

export class PluginResolver {
    
    private _pluginList: PluginList = new Stack<PluginDetail>();
    
    private readonly core: LucenceCore;
    
    constructor(core: LucenceCore) {
        this.core = core;
    }

    // 装配Plugin
    private load(plugin: AbstractPlugin): void {
        // detail数据校验
        if (!plugin.detail) {
            throw Error("Plugin doesn't have detail.");
        }
        // detail.icon校验
        if (!plugin.detail.icon || !matchUrl(plugin.detail.icon)) {
            throw Error("Plugin must provide a correct icon url.");
        }
        // detail.name校验
        if (!plugin.detail.name || !matchName(plugin.detail.name)) {
            throw Error("Plugin must provide a correct name.");
        }
        // detail.version校验
        if (!plugin.detail.version || !matchVersion(plugin.detail.version)) {
            throw Error("Plugin must provide a correct version.");
        }
        // detail.github校验
        if (!plugin.detail.github || !matchUrl(plugin.detail.github)) {
            throw Error("Plugin must provide a correct github url.");
        }
        // TODO 是否已经存在相同name和display的插件，如果是则不load这个插件并throw异常
        
        // 压栈
        this._pluginList.push(plugin.detail);
        plugin.onEnable();

        const commands: PluginCommand[] | null = plugin.createCommands();
        // 初始化插件的commands
        if (commands) {
            commands.forEach((cmd: PluginCommand): void => {
                this.core.editor.addCommand(
                    'markdown',
                    cmd.name,
                    cmd.command,
                )
            });
        }
        // 初始化插件的toolbar
        const toolbar: PluginToolbar | null = plugin.createToolbar();
        if (toolbar) {
            const items: ToolbarItemOptions[] = toolbar.items;
            for (let i: number = 0; i < items.length; i++) {
                this.core.editor.insertToolbarItem({
                    groupIndex: 0,
                    itemIndex: i,
                }, items[i])
            }
        }
    }
    
    // 卸载Plugin
    public disable(plugin: AbstractPlugin): void {
        // 弹栈
        plugin.onDisable();
    }
    
    // 自动挂载
    public autoload(): void {
        // 硬加载基本插件
        const defaultOne: DefaultPlugin = new DefaultPlugin(this.core);
        this.load(defaultOne);
        const testOne: TestPlugin = new TestPlugin(this.core);
        this.load(testOne);
        // 扫描
        this.scanAll();
        
    }
    
    // 扫描所有plugin并通过load挂载
    private scanAll() {
        
    }

    /**
     * 获取plugin列表
     */
    public get pluginList() {
        return this._pluginList;
    }
    
}

function matchName(name: string): boolean {
    const regex: RegExp = /^[a-z_]+$/;
    return regex.test(name);
}

function matchVersion(version: string): boolean {
    const regex: RegExp = /^\d+\.\d+\.\d+$/;
    return regex.test(version);
}

function matchUrl(url: string): boolean {
    // 这是一个简单的URL匹配正则表达式，可能不适用于所有URL，但应该满足基本需求
    const regex: RegExp = 
        /^(https?:\/\/)?([^\s:\/?#]+)(:([0-9]+))?((\/[^\s?#]*)?(\?[^\s#]*)?(#\S*)?)?$/;
    return regex.test(url);
}
