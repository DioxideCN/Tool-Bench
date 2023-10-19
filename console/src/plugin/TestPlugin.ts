import {AbstractPlugin} from "@/extension/BasePlugin";
import type {PluginDetail} from "@/extension/ArgumentPlugin";

export class TestPlugin extends AbstractPlugin {
    public readonly detail: PluginDetail = {
        icon: "https://dbf-publisher.gallerycdn.azure.cn/extensions/dbf-publisher/dbf/0.0.9/1603909271650/Microsoft.VisualStudio.Services.Icons.Default",
        name: "test_plugin",
        display: "测试插件",
        author: "DioxideCN",
        version: "1.0.0",
        description: "这是一个测试插件",
        github: "https://github.com/DioxideCN/Tool-Bench",
    };
}
