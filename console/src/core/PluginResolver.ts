import type { PluginList } from "@/extension/ArgumentPlugin";
import type { AbstractPlugin } from "@/extension/BasePlugin";

export class PluginResolver {
    
    private _pluginList: PluginList = [];
    
    // 装配Plugin到内存
    public assemble(plugin: AbstractPlugin): void {
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
        // 压入plugin列表内
        this._pluginList.push(plugin.detail);
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
