import type {Editor} from "@toast-ui/editor";

function createWrapper(type: 'link' | 'image', handler: Function): HTMLElement {
    const div = document.createElement('div');
    div.className = `${type}-wrapper`;

    const fields = [
        { className: `${type}-alt-wrapper`, label: type === 'link' ? '链接文本' : '图像替代文本', placeholder: type === 'link' ? '输入超链接的显示文本' : '输入图像的替代文本', id: `${type}-ipt--alt` },
        { className: `${type}-url-wrapper`, label: type === 'link' ? '链接地址' : '图像地址', placeholder: type === 'link' ? '输入超链接的URL地址' : '输入图像的URL地址', id: `${type}-ipt--url` }
    ];

    fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = field.className;
        fieldDiv.innerHTML = `<span>${field.label}</span><input type="text" id="${field.id}" placeholder="${field.placeholder}">`;
        div.appendChild(fieldDiv);
    });

    const confirmButton = document.createElement('button');
    confirmButton.id = `${type}-btn--confirm`;
    confirmButton.textContent = '确认';
    confirmButton.addEventListener('click', () => {
        const altInput = document.getElementById(`${type}-ipt--alt`) as HTMLInputElement;
        const urlInput = document.getElementById(`${type}-ipt--url`) as HTMLInputElement;
        const alt = altInput.value;
        const url = urlInput.value;
        handler(alt, url);
        altInput.value = '';
        urlInput.value = '';
    });
    div.appendChild(confirmButton);

    return div;
}

export const PopupBuilder = {
    /**
     * 构造弹出框DOM
     * @param title 标题
     * @param instance 编辑器实例
     * @param domArr 内部dom组
     */
    build: (title: string, 
            instance: Editor, 
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
        btnGroupIcon.addEventListener('click', () => {
            PopupBuilder.closePopup(instance);
        })
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
    closePopup: (instance: Editor): void => {
        instance.eventEmitter.emit('closePopup');
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
        },
        table: (handler: Function): HTMLElement => {
            const tableDiv = document.createElement('div');
            tableDiv.className = "popup-tableDiv--main";
            const headerDiv = document.createElement('div');
            headerDiv.className = "popup-tableDiv--display";
            headerDiv.textContent = "插入 1 行 1 列的表格";
            tableDiv.appendChild(headerDiv);
            for (let y = 1; y <= 8; y++) {
                const rowDiv = document.createElement('div');
                rowDiv.className = "popup-tableDiv--row";
                for (let x = 1; x <= 10; x++) {
                    const cellSpan = document.createElement('span');
                    cellSpan.className = "popup-tableDiv--cell";
                    if (x === 1 && y === 1) {
                        cellSpan.classList.add('active');
                    }
                    cellSpan.setAttribute('data-x', x.toString());
                    cellSpan.setAttribute('data-y', y.toString());
                    rowDiv.appendChild(cellSpan);
                    cellSpan.addEventListener('click', () => {
                        handler(x, y);
                        // 清除所有 active 类，除了 x=1 和 y=1 的元素
                        const cells = tableDiv.querySelectorAll('span');
                        cells.forEach((cell) => {
                            const cellX = parseInt(cell.getAttribute('data-x')!, 10);
                            const cellY = parseInt(cell.getAttribute('data-y')!, 10);

                            if (cellX === 1 && cellY === 1) {
                                cell.classList.add('active');
                            } else {
                                cell.classList.remove('active');
                            }
                        });
                        // 更新头部 div 的内容
                        headerDiv.textContent = "插入 1 行 1 列的表格";
                    });
                }
                tableDiv.appendChild(rowDiv);
            }
            tableDiv.addEventListener('mouseover', function(event) {
                const target = event.target as HTMLElement;
                if (target.tagName === 'SPAN') {
                    const x = parseInt(target.getAttribute('data-x')!, 10);
                    const y = parseInt(target.getAttribute('data-y')!, 10);
                    headerDiv.textContent = `插入 ${y} 行 ${x} 列的表格`;
                    const cells = tableDiv.querySelectorAll('span');
                    cells.forEach((cell) => {
                        const cellX = parseInt(cell.getAttribute('data-x')!, 10);
                        const cellY = parseInt(cell.getAttribute('data-y')!, 10);
                        if (cellX <= x && cellY <= y) {
                            cell.classList.add('active');
                        } else {
                            cell.classList.remove('active');
                        }
                    });
                }
            });
            return tableDiv;
        },
        link: (handler: Function): HTMLElement => {
            return createWrapper('link', handler);
        },
        image: (handler:Function): HTMLElement => {
            return createWrapper('image', handler);
        },
    },
}
