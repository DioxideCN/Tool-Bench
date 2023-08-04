'use strict';

(function() {
    window.addEventListener('load', function() {
        const {pinyin} = pinyinPro;
        const container = document.querySelector('.categories-container');
        if (container !== null) {
            const categories = Array.from(container.children);

            categories.sort(function(a, b) {
                let displayNameA = a.querySelector('.posts-container').dataset.collection;
                let displayNameB = b.querySelector('.posts-container').dataset.collection;

                // 把 "其它" 分类移至最后
                if (displayNameA === "其它") return 1;
                if (displayNameB === "其它") return -1;

                const isLetterA = isLetterOrNumber(displayNameA.charAt(0));
                const isLetterB = isLetterOrNumber(displayNameB.charAt(0));

                // 如果 displayNameA 的首字符是字母或数字，但 displayNameB 的首字符不是，则 displayNameA 排在前面
                if (isLetterA && !isLetterB) return -1;

                // 如果 displayNameB 的首字符是字母或数字，但 displayNameA 的首字符不是，则 displayNameB 排在前面
                if (isLetterB && !isLetterA) return 1;

                // 如果 displayNameA 或 displayNameB 不满足全是英文字母的正则表达式，则将其转换为拼音
                if (!isAllLetterOrNumber(displayNameA)) displayNameA = pinyin(displayNameA, { toneType: 'none' }).replaceAll(" ", "");
                if (!isAllLetterOrNumber(displayNameB)) displayNameB = pinyin(displayNameB, { toneType: 'none' }).replaceAll(" ", "");

                // 最后按照字母和数字的顺序排序
                return displayNameA.localeCompare(displayNameB);
            });

            categories.forEach(function(category) {
                container.appendChild(category);
            });

            // 定义一个函数，判断一个字符是否为字母或数字
            function isLetterOrNumber(char) {
                return /^[a-zA-Z0-9]$/.test(char);
            }

            // 定义一个函数，判断一个字符串是否全是英文字母或数字
            function isAllLetterOrNumber(str) {
                return /^[a-zA-Z0-9]+$/.test(str);
            }
        }
    });

    window.addEventListener('resize', adjustPadding);
    function adjustPadding() {
        let adjustPadding = window.innerWidth < 750 ? "0" : "10px";
        // 以data-collection值为键将元素分组
        const collectionGroups = {};
        document.querySelectorAll('.category').forEach(el => {
            const collection = el.getAttribute('data-collection');
            if(!collectionGroups[collection]) {
                collectionGroups[collection] = [];
            }
            collectionGroups[collection].push(el);
        });

        // 遍历每个分组并调整padding
        for(let collection in collectionGroups) {
            collectionGroups[collection].forEach((el, index, array) => {
                if(index === 0) {
                    el.style.paddingBottom = adjustPadding;
                } else if(index === array.length - 1) {
                    el.style.paddingTop = adjustPadding;
                } else {
                    el.style.paddingTop = adjustPadding;
                    el.style.paddingBottom = adjustPadding;
                }
            });
        }
    }
    adjustPadding();
})();
