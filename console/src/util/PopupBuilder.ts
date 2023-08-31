export const PopupBuilder = {
    /**
     * 构造弹出框DOM
     * @param title 标题
     * @param closeAction 关闭事件
     * @param domArr 内部dom组
     */
    build: (title: string, 
            closeAction: Function, 
            ...domArr: HTMLElement[]): HTMLElement => {
        // 创建最外层的包裹 div
        const wrapperDiv = document.createElement('div');
        // 创建外层 div
        const outerDivHead = document.createElement('div');
        outerDivHead.className = 'popup-inner--head';
        // 创建标题 span
        const titleSpan = document.createElement('span');
        titleSpan.className = 'popup-head--title';
        titleSpan.textContent = title;
        // 创建按钮组 div
        const btnGroupDiv = document.createElement('div');
        btnGroupDiv.className = 'popup-head--btn-group';
        // 创建按钮组内的 i 元素
        const btnGroupIcon = document.createElement('i');
        btnGroupIcon.className = 'fa-solid fa-xmark closable';
        btnGroupIcon.addEventListener('click', (e) => closeAction(e))
        // 将标题和按钮组添加到外层 div
        btnGroupDiv.appendChild(btnGroupIcon);
        outerDivHead.appendChild(titleSpan);
        outerDivHead.appendChild(btnGroupDiv);
        // 创建容器 div
        const outerDivContainer = document.createElement('div');
        outerDivContainer.className = 'popup-inner--container';
        // 将 domArr 中的所有元素添加到容器 div
        domArr.forEach((domElement) => {
            outerDivContainer.appendChild(domElement);
        });
        // 将所有元素添加到最外层的包裹 div
        wrapperDiv.appendChild(outerDivHead);
        wrapperDiv.appendChild(outerDivContainer);
        return wrapperDiv;
    },
    
    
    UseRegular: {
        heading: (level: number, text: string, handler: Function): HTMLElement => {
            const div = document.createElement('div');
            div.className = 'heading-item';
            div.dataset.level = level.toString();
            div.textContent = text;
            div.addEventListener('click', (e) => {
                handler(level);
            });
            return div;
        },
        emoji: (handler: Function, emojiList: string[]): HTMLElement => {
            const ul = document.createElement('ul');
            ul.className = 'emoji-list';
            emojiList.forEach((emoji) => {
                const li = document.createElement('li');
                li.className = 'emoji-item';
                li.textContent = emoji;
                ul.appendChild(li);
                li.addEventListener('click', (e) => {
                    handler(emoji);
                })
            });
            return ul;
        }
    },
}
