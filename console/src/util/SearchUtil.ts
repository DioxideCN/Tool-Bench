export const SearchUtil = {
    /**
     * 从context中使用searchString内容进行搜索
     * @param context 上下文
     * @param search 搜索内容
     */
    text: (context: string, search: string) => {
        if (context && search) {
            
        }
    },
    /**
     * 从context中使用searchRegex正则表达式进行搜索
     * @param context 上下文
     * @param search 搜索内容
     */
    regex: (context: string, search: string) => {
        if (context && search) {
            let total = 0;
            const markList: number[][] = [];
            const lines = context.split('\n');
            lines.forEach((line, rowIndex) => {
                let columnIndex = line.indexOf(search);
                while (columnIndex !== -1) {
                    total++;
                    markList.push([rowIndex + 1, columnIndex + 1]); // +1 because line and column numbers usually start from 1
                    columnIndex = line.indexOf(search, columnIndex + search.length);
                }
            });
            return { total, markList };
        }
    },
}
