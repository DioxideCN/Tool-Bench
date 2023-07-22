'use strict';

/* 获取直属子元素 */
function getChildren(el, className) {
    for (let item of el.children) if (item.className === className) return item;
    return null;
}

(function() {
    document.addEventListener("DOMContentLoaded", () => {

        // github仓库
        customElements.define(
            "tool-github",
            class GithubDom extends HTMLElement {
                constructor() {
                    super();
                    this.owner = this.getAttribute("owner") || "";
                    this.repo = this.getAttribute("repo") || "";
                    if (this.owner.length === 0 || this.repo.length === 0) {
                        return;
                    }
                    this.innerHTML = `<div class="github-box"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="margin: auto; background: rgb(13,17,23); display: block; shape-rendering: auto;" width="100px" height="100px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid"><g transform="rotate(0 50 50)"><rect x="48" y="21" rx="0" ry="0" width="4" height="12" fill="#85a2b6"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1.5625s" begin="-1.4322916666666667s" repeatCount="indefinite"></animate></rect></g><g transform="rotate(30 50 50)"><rect x="48" y="21" rx="0" ry="0" width="4" height="12" fill="#85a2b6"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1.5625s" begin="-1.3020833333333335s" repeatCount="indefinite"></animate></rect></g><g transform="rotate(60 50 50)"><rect x="48" y="21" rx="0" ry="0" width="4" height="12" fill="#85a2b6"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1.5625s" begin="-1.171875s" repeatCount="indefinite"></animate></rect></g><g transform="rotate(90 50 50)"><rect x="48" y="21" rx="0" ry="0" width="4" height="12" fill="#85a2b6"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1.5625s" begin="-1.0416666666666667s" repeatCount="indefinite"></animate></rect></g><g transform="rotate(120 50 50)"><rect x="48" y="21" rx="0" ry="0" width="4" height="12" fill="#85a2b6"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1.5625s" begin="-0.9114583333333334s" repeatCount="indefinite"></animate></rect></g><g transform="rotate(150 50 50)"><rect x="48" y="21" rx="0" ry="0" width="4" height="12" fill="#85a2b6"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1.5625s" begin="-0.78125s" repeatCount="indefinite"></animate></rect></g><g transform="rotate(180 50 50)"><rect x="48" y="21" rx="0" ry="0" width="4" height="12" fill="#85a2b6"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1.5625s" begin="-0.6510416666666667s" repeatCount="indefinite"></animate></rect></g><g transform="rotate(210 50 50)"><rect x="48" y="21" rx="0" ry="0" width="4" height="12" fill="#85a2b6"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1.5625s" begin="-0.5208333333333334s" repeatCount="indefinite"></animate></rect></g><g transform="rotate(240 50 50)"><rect x="48" y="21" rx="0" ry="0" width="4" height="12" fill="#85a2b6"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1.5625s" begin="-0.390625s" repeatCount="indefinite"></animate></rect></g><g transform="rotate(270 50 50)"><rect x="48" y="21" rx="0" ry="0" width="4" height="12" fill="#85a2b6"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1.5625s" begin="-0.2604166666666667s" repeatCount="indefinite"></animate></rect></g><g transform="rotate(300 50 50)"><rect x="48" y="21" rx="0" ry="0" width="4" height="12" fill="#85a2b6"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1.5625s" begin="-0.13020833333333334s" repeatCount="indefinite"></animate></rect></g><g transform="rotate(330 50 50)"><rect x="48" y="21" rx="0" ry="0" width="4" height="12" fill="#85a2b6"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1.5625s" begin="0s" repeatCount="indefinite"></animate></rect></g></svg></div>`
                    this.fetchDataAndRender();
                }
                async fetchDataAndRender() {
                    try {
                        const res = await this.fetchRepoInfo();
                        const commits = await this.fetchRepoCommits();
                        this.render(res, commits);
                    } catch (error) {
                        console.error("Error:", error);
                    }
                }
                async fetchRepoInfo() {
                    const response = await fetch(`/apis/api.plugin.halo.run/v1alpha1/plugins/ToolBench/github/repository?owner=${this.owner}&repo=${this.repo}`);
                    const data = await response.json();
                    return data.data.repository;
                }
                async fetchRepoCommits() {
                    const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/stats/participation`);
                    const commits = await response.json();
                    return commits.all;
                }
                render(res, commits) {
                    let updatedAtDate = new Date(res.updatedAt);
                    let currentYear = new Date().getFullYear();
                    let dateFormatOptions = { month: 'long', day: 'numeric' };
                    if (updatedAtDate.getFullYear() !== currentYear) {
                        dateFormatOptions.year = 'numeric';
                    }
                    let updatedAt = updatedAtDate.toLocaleDateString("en-US", dateFormatOptions);
                    let points = commits.map((value, index) => `${index*3},${value+1}`).join(' ');
                    let polyline = this.generatePolyline(points);
                    this.innerHTML = this.generateHTMLTemplate(res, polyline, updatedAt);
                }
                generatePolyline(points) {
                    return `<polyline transform="translate(0, 28) scale(1,-1)" points="${points}" fill="transparent" stroke="#8cc665" stroke-width="2"></polyline>`;
                }
                generateHTMLTemplate(res, polyline, updatedAt) {
                    return `<div class="github-box">
                                <div class="github-box-flex">
                                    <div class="flex-auto">
                                        <a target="_blank" href="${res.url}" class="repo-title">
                                            ${res.name}
                                        </a>
                                        <span class="repo-label">
                                            Public
                                        </span>
                                        <p class="repo-desc">
                                            ${res.description}
                                        </p>
                                    </div>
                                    <div class="commits-data">
                                        <span class="tooltipped tooltipped-s" aria-label="Past year of activity">
                                            <svg width="155" height="30">
                                                <defs>
                                                    <linearGradient id="gradient-618008006" x1="0" x2="0" y1="1" y2="0">
                                                        <stop offset="0%" stop-color="#0e4429"></stop>
                                                        <stop offset="10%" stop-color="#006d32"></stop>
                                                        <stop offset="25%" stop-color="#26a641"></stop>
                                                        <stop offset="50%" stop-color="#39d353"></stop>
                                                    </linearGradient>
                                                    <mask id="sparkline-618008006" x="0" y="0" width="155" height="28">
                                                        ${polyline}
                                                    </mask>
                                                </defs>
                                                <g transform="translate(0, -5)">
                                                    <rect x="0" y="-2" width="155" height="30" style="stroke: none; fill: url(#gradient-618008006); mask: url(#sparkline-618008006)"></rect>
                                                </g>
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                                <div class="detail-label">
                                    <span class="mr-3">
                                        <span class="repo-language-color" style="background-color: ${res.primaryLanguage.color}"></span>
                                        <span>${res.primaryLanguage.name}</span>
                                    </span>
                                    <span class="mr-3">
                                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="mr-1">
                                            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path>
                                        </svg>
                                        ${res.stargazerCount}
                                    </span>
                                    <span class="mr-3">
                                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="mr-1">
                                            <path d="M8.75.75V2h.985c.304 0 .603.08.867.231l1.29.736c.038.022.08.033.124.033h2.234a.75.75 0 0 1 0 1.5h-.427l2.111 4.692a.75.75 0 0 1-.154.838l-.53-.53.529.531-.001.002-.002.002-.006.006-.006.005-.01.01-.045.04c-.21.176-.441.327-.686.45C14.556 10.78 13.88 11 13 11a4.498 4.498 0 0 1-2.023-.454 3.544 3.544 0 0 1-.686-.45l-.045-.04-.016-.015-.006-.006-.004-.004v-.001a.75.75 0 0 1-.154-.838L12.178 4.5h-.162c-.305 0-.604-.079-.868-.231l-1.29-.736a.245.245 0 0 0-.124-.033H8.75V13h2.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h2.5V3.5h-.984a.245.245 0 0 0-.124.033l-1.289.737c-.265.15-.564.23-.869.23h-.162l2.112 4.692a.75.75 0 0 1-.154.838l-.53-.53.529.531-.001.002-.002.002-.006.006-.016.015-.045.04c-.21.176-.441.327-.686.45C4.556 10.78 3.88 11 3 11a4.498 4.498 0 0 1-2.023-.454 3.544 3.544 0 0 1-.686-.45l-.045-.04-.016-.015-.006-.006-.004-.004v-.001a.75.75 0 0 1-.154-.838L2.178 4.5H1.75a.75.75 0 0 1 0-1.5h2.234a.249.249 0 0 0 .125-.033l1.288-.737c.265-.15.564-.23.869-.23h.984V.75a.75.75 0 0 1 1.5 0Zm2.945 8.477c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L13 6.327Zm-10 0c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L3 6.327Z"></path>
                                        </svg>
                                        ${res.licenseInfo.nickname}
                                    </span>
                                    <span class="mr-3">
                                        <svg aria-label="fork" role="img" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="mr-1">
                                            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>
                                        </svg>
                                        ${res.forks.totalCount}
                                    </span>
                                    <a target="_blank" href="/Team-Sangonomiya/DigitalCarbon-DataAnalysis/issues" class="mr-3">
                                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="mr-1">
                                            <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                                        </svg>
                                        ${res.issues.totalCount}
                                    </a>
                                    <a target="_blank" href="/Team-Sangonomiya/DigitalCarbon-DataAnalysis/pulls" class="mr-3">
                                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="mr-1">
                                            <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path>
                                        </svg>
                                        ${res.pullRequests.totalCount}
                                    </a>
                                    <span class="update-time">
                                        Updated on ${updatedAt}
                                    </span>
                                </div>
                            </div>
                        `
                }
            }
        );


        // 彩虹虚线
        customElements.define(
            "tool-dotted",
            class DottedDom extends HTMLElement {
                constructor() {
                    super();
                    this.startColor = this.getAttribute("begin") || "#ff6c6c";
                    this.endColor = this.getAttribute("end") || "#1989fa";
                    this.innerHTML = `
					<span class="tool_dotted" style="background-image: repeating-linear-gradient(-45deg, ${this.startColor} 0, ${this.startColor} 20%, transparent 0, transparent 25%, ${this.endColor} 0, ${this.endColor} 45%, transparent 0, transparent 50%)"></span>
				`;
                }
            }
        );

        // 时间轴
        customElements.define(
            "tool-timeline",
            class TimelineDom extends HTMLElement {
                constructor() {
                    super();
                    const _temp = getChildren(this, "_tpl");
                    let _innerHTML = _temp.innerHTML.trim().replace(/^(<br>)|(<br>)$/g, "");
                    let content = "";
                        _innerHTML.replace(
                            /{timeline-item([^}]*)}([\s\S]*?){\/timeline-item}/g,
                            function ($0, $1, $2) {
                            content += `
                                <div class="tool_timeline__item">
                                    <div class="tool_timeline__item-tail"></div>
                                    <div class="tool_timeline__item-circle" ${$1}></div>
                                    <div class="tool_timeline__item-content">${$2
                                            .trim()
                                            .replace(/^(<br>)|(<br>)$/g, "")}</div>
                                </div>
                            `;
                        }
                    );
                    let htmlStr = `<div class="tool_timeline">${content}</div>`;
                    if (getChildren(this, "_content")) {
                        getChildren(this, "_content").innerHTML = htmlStr;
                    } else {
                        const span = document.createElement("span");
                        span.className = "_content";
                        span.style.display = "block";
                        span.innerHTML = htmlStr;
                        this.appendChild(span);
                    }
                    this.querySelectorAll(".tool_timeline__item-circle").forEach(
                        (item, index) => {
                            const color = item.getAttribute("color") || "#19be6b";
                            item.style.borderColor = color;
                        }
                    );

                    _temp.parentNode.removeChild(_temp); // 清理无用标签
                }
            }
        );

        // 分栏
        customElements.define(
            "tool-tabs",
            class TabsDom extends HTMLElement {
                constructor() {
                    super();
                    const _temp = getChildren(this, "_tpl");
                    let _innerHTML = _temp.innerHTML.trim().replace(/^(<br>)|(<br>)$/g, "");
                    let navs = "";
                    let contents = "";
                    _innerHTML.replace(
                        /{tabs-pane([^}]*)}([\s\S]*?){\/tabs-pane}/g,
                        function ($0, $1, $2) {
                            navs += `<div class="tool_tabs__head-item" label="${$1}"></div>`;
                            contents += `<div style="display: none" class="tool_tabs__body-item" label="${$1}">${$2
                                .trim()
                                .replace(/^(<br>)|(<br>)$/g, "")}</div>`;
                        }
                    );
                    let htmlStr = `
                        <div class="tool_tabs">
                            <div class="tool_tabs__head">${navs}</div>
                            <div class="tool_tabs__body">${contents}</div>
                        </div>
                    `;
                    if (getChildren(this, "_content")) {
                        getChildren(this, "_content").innerHTML = htmlStr;
                    } else {
                        const span = document.createElement("span");
                        span.className = "_content";
                        span.style.display = "block";
                        span.innerHTML = htmlStr;
                        this.appendChild(span);
                    }
                    this.querySelectorAll(".tool_tabs__head-item").forEach((item, index) => {
                        const label = item.getAttribute("label");
                        item.innerHTML = label;
                        item.addEventListener("click", (e) => {
                            e.stopPropagation();
                            this.querySelectorAll(".tool_tabs__head-item").forEach((_item) =>
                                _item.classList.remove("active")
                            );
                            this.querySelectorAll(".tool_tabs__body-item").forEach(
                                (_item) => (_item.style.display = "none")
                            );
                            if (this.querySelector(`.tool_tabs__body-item[label="${label}"]`)) {
                                this.querySelector(
                                    `.tool_tabs__body-item[label="${label}"]`
                                ).style.display = "block";
                            }
                            item.classList.add("active");
                        });
                        if (index === 0) item.click();
                    });
                    _temp.parentNode.removeChild(_temp); // 清理无用标签
                }
            }
        );

        // 标签消息
        customElements.define(
            "tool-msg",
            class MessageDom extends HTMLElement {
                constructor() {
                    super();
                    this.options = {
                        type: /^success$|^info$|^warning$|^error$/.test(
                            this.getAttribute("type")
                        )
                            ? this.getAttribute("type")
                            : "info",
                        content: this.getAttribute("content") || "消息内容",
                    };
                    this.innerHTML = `
					<span class="tool_message ${this.options.type}">
						<span class="tool_message__icon"></span>
						<span class="tool_message__content">${this.options.content}</span>
					</span>
				`;
                }
            }
        );

        // 居中标题
        customElements.define(
            "tool-mtitle",
            class MtitleDom extends HTMLElement {
                constructor() {
                    super();
                    this.innerHTML = `
                        <span class="tool_mtitle">
                            <span class="tool_mtitle__text">
                                ${this.getAttribute("title") || "默认标题"}
                            </span>
                        </span>
                    `;
                }
            }
        );

        // 进度条
        customElements.define(
            "tool-progress",
            class ProgressDom extends HTMLElement {
                constructor() {
                    super();
                    this.options = {
                        percentage: /^\d{1,3}%$/.test(this.getAttribute("pct"))
                            ? this.getAttribute("pct")
                            : "50%",
                        color: this.getAttribute("color") || "#ff6c6c",
                    };
                    this.innerHTML = `
                        <span class="tool_progress">
                            <div class="tool_progress__strip">
                                <div class="tool_progress__strip-percent" style="width: ${this.options.percentage}; background: ${this.options.color};"></div>
                            </div>
                            <div class="tool_progress__percentage">${this.options.percentage}</div>
                        </span>
                    `;
                }
            }
        );

        // 小标记
        customElements.define(
            "tool-sign",
            class SignDom extends HTMLElement {
                constructor() {
                    super();
                    this.options = {
                        type: this.getAttribute("type"), // 小标签类型
                        content: this.innerHTML, // 内容
                    };
                    this.render();
                }
                render() {
                    this.innerHTML = `<span class="${this.options.type}">${this.options.content}</span>`;
                }
            }
        );

        // B站视频
        customElements.define(
            "tool-bilibili",
            class BiliBiliDom extends HTMLElement {
                constructor() {
                    super();
                    this.options = {
                        bvid: this.getAttribute("bvid"),
                        page: +(this.getAttribute("page") || "1"),
                        width: this.getAttribute("width") || "100%",
                        height: this.getAttribute("height") || "500px",
                    };
                    this.render();
                }
                render() {
                    if (this.options.bvid)
                        this.innerHTML = `
                            <iframe class="iframe-dom" allowfullscreen="true" class="tool_vplayer" src="//player.bilibili.com/player.html?bvid=${this.options.bvid}&page=${this.options.page}" style="width:${this.options.width};height:${this.options.height}"></iframe>`;
                    else this.innerHTML = "请填写正确的BVID";
                }
            }
        );

        // pdf
        customElements.define(
            "tool-pdf",
            class PDFDom extends HTMLElement {
                constructor() {
                    super();
                    this.options = {
                        src: this.getAttribute("src") || "",
                        width: this.getAttribute("width") || "100%",
                        height: this.getAttribute("height") || "500px",
                    };
                    this.render();
                }
                render() {
                    if (!this.options.src) return (this.innerHTML = "请填写正确的PDF链接");
                    this.innerHTML = `
                        <div class="tool_pdf">
                            <iframe class="iframe-dom" src="${this.options.src}" style="width:${this.options.width};height:${this.options.height}"></iframe>
                        </div>`;
                }
            }
        );

    })
})();