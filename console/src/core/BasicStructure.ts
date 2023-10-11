import type {PluginEvent, PluginEventDefinition, EventHandler, PluginEventConverter} from "@/extension/ArgumentPlugin";

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
    
    constructor() {
        
    }
    
    // 註冊事件
    public register(source: string, 
                    definition: PluginEventDefinition): void {
        if (definition) {
            // 按異常壓棧
            try {
                this.eventStacks[definition.type]!
                    .push(this.converter(source, definition)!);
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

class Stack<T> {
    private items: T[] = [];

    push(element: T): void {
        this.items.push(element);
    }

    pop(): T | undefined {
        return this.items.pop();
    }

    peek(): T | undefined {
        return this.items[this.items.length - 1];
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    size(): number {
        return this.items.length;
    }

    clear(): void {
        this.items = [];
    }

    elems(): T[] {
        return [...this.items];
    }
}
