import type {PluginCommand, PluginDetail, PluginHolder, PluginList, PluginToolbar} from "@/extension/ArgumentPlugin";
import type { AbstractPlugin } from "@/extension/BasePlugin";
import {Stack} from "@/core/BasicStructure";
import type {ToolbarItemOptions} from "@toast-ui/editor/types/ui";
import type {LucenceCore} from "@/core/LucenceCore";
import {DefaultPlugin} from "@/plugin/DefaultPlugin";
import {TestPlugin} from "@/plugin/TestPlugin";

export class PluginResolver {
    
    private readonly _pluginList: PluginList = new Stack<PluginHolder>();
    
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
        const holder: PluginHolder = {
            key: plugin.detail.name,
            detail: plugin.detail,
            register: {
                toolbar: [],
                command: [],
                event: [],
            }
        };
        // 是否已经存在相同name和display的插件，如果是则不load这个插件并throw异常中断程序
        for (let elem of this._pluginList.elems()) {
            if (elem.key === plugin.detail.name) {
                throw Error(`Plugin ${plugin.detail.name} has been registered, you should change your plugin id.`);
            }
        }
        // 插件的事件注册在BasicStructure#PluginEventHolder.register方法中进行实现
        const commands: PluginCommand[] | null = plugin.createCommands();
        // 注册toolbar
        const toolbar: PluginToolbar | null = plugin.createToolbar();
        if (toolbar) {
            const items: ToolbarItemOptions[] = toolbar.items;
            for (let i: number = 0; i < items.length; i++) {
                this.core.editor.insertToolbarItem({
                    groupIndex: 0,
                    itemIndex: i,
                }, items[i]);
                holder.register.toolbar.push({
                    key: `${plugin.detail.name}.tool.${i + 1}`,
                    name: `${items[i].name}`,
                    tooltip: `${items[i].tooltip}`,
                });
            }
        }
        // 注册commands
        if (commands) {
            for (let i = 0; i < commands.length; i++) {
                this.core.editor.addCommand(
                    'markdown',
                    commands[i].name,
                    commands[i].command,
                )
                holder.register.command.push({
                    key: `${plugin.detail.name}.command.${i + 1}`,
                    name: `${commands[i].name}`,
                    returnType: `boolean`,
                });
            }
        }
        // 将构建完成的插件压栈
        this._pluginList.push(holder);
        plugin.onEnable();
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
    public get pluginList(): PluginHolder[] {
        return this._pluginList.elems();
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
