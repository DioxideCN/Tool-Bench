export type CacheType = {
    line: {
        oldLineCount: number,
        prevIndexMap: Map<number, number>,
    },
    feature: {
        preview: boolean,                     // 启用预览
        autoSave: boolean,                    // 自动保存
        search: {
            enable: boolean,                  // 开启查找
            replace: boolean,                 // 开启替换
            condition: {
                capitalization: boolean,      // 大小写敏感
                regular: boolean,             // 正则查找
                keepCap: boolean,             // 保留大小写
            },
            result: {
                total: number,                // 结果总数
                hoverOn: number,              // 正在聚焦
                list: number[] | number[][],  // 搜索结果集
            },
        },
        count: {
            words: number,                    // 总计词数
            characters: number,               // 总计字符数
            selected: number,                 // 已选择字符数
        },
        focus: {
            row: number,                      // 聚焦的行
            col: number,                      // 聚焦的列
        }
    },
    theme: 'light' | 'night',                 // 深浅色模式
    plugin: {
        enable: boolean,                      // 开启插件菜单
    },
};

export type AreaType = {
    preview: HTMLElement,
    editor: HTMLElement,
    split: HTMLElement,
    mdEditor: HTMLElement,
    lineBox: HTMLElement,
}
