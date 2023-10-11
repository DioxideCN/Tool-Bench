import type {PluginCommand, PluginDetail, PluginToolbar} from "@/extension/ArgumentPlugin";
import type {LucenceCore} from "@/core/LucenceCore";

export abstract class AbstractPlugin {
    
    protected readonly core: LucenceCore;
    public abstract readonly detail: PluginDetail;

    constructor(core: LucenceCore) {
        this.core = core;
    }

    /**
     * 生命周期：插件挂载并启用时
     * 必要时三方开发者需要对基类进行覆写
     */
    onEnable(): void {
    };

    /**
     * 生命周期：插件禁用并卸载时
     * 必要时三方开发者需要对基类进行覆写
     */
    onDisable(): void {
    };

    /**
     * 创建：插件的Toolbar项目
     * 必要时三方开发者需要对基类进行覆写
     */
    createToolbar(): PluginToolbar | null {
        return null;
    };

    /**
     * 创建：插件需要使用到的commands
     * 必要时三方开发者需要对基类进行覆写
     */
    createCommands(): PluginCommand[] | null {
        return null;
    };
    
}
