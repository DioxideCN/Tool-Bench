import type { Editor } from "@toast-ui/editor";
import type {PluginCommand, PluginDetail, PluginToolbar} from "@/extension/ArgumentPlugin";

export abstract class AbstractPlugin {
    
    protected readonly instance: Editor;
    public abstract readonly detail: PluginDetail;

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
    abstract createCommands(): PluginCommand[];
    
}
