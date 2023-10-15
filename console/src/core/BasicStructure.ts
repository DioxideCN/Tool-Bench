import type {PluginEvent, PluginEventDefinition, PluginEventConverter} from "@/extension/ArgumentPlugin";
import type {PluginResolver} from "@/core/PluginResolver";
import type {AbstractPlugin} from "@/extension/BasePlugin";

type EventStackObject = {
    [K in PluginEvent]: Stack<PluginEventConverter>
};

// 插件事件持有對象
export class PluginEventHolder {
    // 不可變事件棧
    private readonly eventStacks: EventStackObject = {
        "content_input"   :   new Stack<PluginEventConverter>(),
        "content_delete"  :   new Stack<PluginEventConverter>(),
        "content_select"  :   new Stack<PluginEventConverter>(),
        "content_change"  :   new Stack<PluginEventConverter>(),
        "render_html"     :   new Stack<PluginEventConverter>(),
        "render_code"     :   new Stack<PluginEventConverter>(),
        "render_latex"    :   new Stack<PluginEventConverter>(),
        "render_mermaid"  :   new Stack<PluginEventConverter>(),
        "search_text"     :   new Stack<PluginEventConverter>(),
        "search_regex"    :   new Stack<PluginEventConverter>(),
        "search_next"     :   new Stack<PluginEventConverter>(),
        "search_prev"     :   new Stack<PluginEventConverter>(),
        "switch_autosave" :   new Stack<PluginEventConverter>(),
        "switch_search"   :   new Stack<PluginEventConverter>(),
        "switch_preview"  :   new Stack<PluginEventConverter>(),
        "window_resize"   :   new Stack<PluginEventConverter>(),
        "theme_change"    :   new Stack<PluginEventConverter>(),
    };
    
    private readonly resolver: PluginResolver;
    
    constructor(resolver: PluginResolver) {
        this.resolver = resolver;
    }
    
    // 註冊事件
    public register(source: string, 
                    definition: PluginEventDefinition): void {
        if (definition) {
            // 按異常壓棧
            try {
                this.eventStacks[definition.type]!
                    .push(this.converter(source, definition)!);
                for (let i = 0; i < this.resolver.pluginList.length; i++) {
                    if (this.resolver.pluginList[i].key === source) {
                        this.resolver.pluginList[i].register.event.push({
                            key: `${source}.event.${i}`,
                            eventType: definition.type,
                        });
                    }
                }
            } catch (e) {
                throw e;
            }
            return;
        }
        // throw
        throw new Error("Illegal plugin event definition found.");
    }
    
    // 調用所有一個類型的事件
    public callSeries(eventType: PluginEvent): void {
        // prev condition of stack size
        if (this.eventStacks[eventType].size() === 0) return;
        // call func
        this.eventStacks[eventType]!
            .elems()
            .forEach((converter: PluginEventConverter): void => {
                converter.callback();
            });
    }
    
    private converter(source: string, 
                      definition: PluginEventDefinition): PluginEventConverter {
        return {
            source:   source,
            callback: definition.callback,
        };
    }
}

export class Stack<T> {
    private items: T[] = [];

    /**
     * 压栈
     */
    push(element: T): void {
        this.items.push(element);
    }

    /**
     * 弹栈
     */
    pop(): T | undefined {
        return this.items.pop();
    }

    /**
     * 栈顶元素
     */
    peek(): T | undefined {
        return this.items[this.items.length - 1];
    }

    /**
     * 是否为空栈
     */
    isEmpty(): boolean {
        return this.items.length === 0;
    }

    /**
     * 栈大小
     */
    size(): number {
        return this.items.length;
    }

    /**
     * 清空栈
     */
    clear(): void {
        this.items = [];
    }

    /**
     * 转为数组
     */
    elems(): T[] {
        return [...this.items];
    }
}
