export const ContextUtil = {
    countWord: (text: string) => {
        // 移除 Markdown 格式
        const plainText = text.replace(/\s+/g, '');
        const _characterCount = plainText.length;

        // 移除英文单词，剩下的字符按长度统计
        let _wordCount = (text.match(/\b[a-zA-Z]+\b/g) || []).length;
        const remainingText = text.replace(/\b[a-zA-Z]+\b/g, '');
        _wordCount += remainingText.replace(/\s+/g, '').length;

        return {
            _wordCount,
            _characterCount
        };
    }
}
