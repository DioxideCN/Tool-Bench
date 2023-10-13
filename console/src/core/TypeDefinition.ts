export type CacheType = {
    line: {
        oldLineCount: number,
        prevIndexMap: Map<number, number>,
    },
    feature: {
        preview: boolean,
        autoSave: boolean,
        search: {
            enable: boolean,
            condition: {
                capitalization: boolean,
                regular: boolean,
            },
            result: {
                total: number,
                hoverOn: number,
                list: number[] | number[][],
            },
        },
        count: {
            words: number,
            characters: number,
            selected: number,
        },
        focus: {
            row: number,
            col: number,
        }
    },
    theme: 'light' | 'night',
    plugin: {
        enable: boolean,
    },
};

export type AreaType = {
    preview: HTMLElement,
    editor: HTMLElement,
    split: HTMLElement,
    mdEditor: HTMLElement,
    lineBox: HTMLElement,
}
