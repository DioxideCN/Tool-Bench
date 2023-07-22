package run.halo.toolbench.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author Dioxide.CN
 * @date 2023/7/20
 * @since 1.0
 */
public class DomBuilder {

    private static final String ABSOLUTE_PATH = "/plugins/ToolBench/assets/static";
    private static final String SCRIPT_HEAD =
            "<script src=\"" + ABSOLUTE_PATH;
    private static final String STYLE_HEAD =
            "<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"" + ABSOLUTE_PATH;
    private static final String SCRIPT_END = "></script>";
    private static final String STYLE_END = "\" />";

    private final List<String> DOM_LIST = new ArrayList<>();

    // 使用
    public static DomBuilder use() {
        return new DomBuilder();
    }

    // 构建 style
    public DomBuilder style(String href) {
        // 直接形成style标签
        DOM_LIST.add(STYLE_HEAD + handlePath(href) + "\"" + STYLE_END);
        return this;
    }

    // 构建script
    public DomBuilder script(String path) {
        // 直接形成scripts标签
        return script(path, true);
    }

    public DomBuilder script(String path, boolean trigger) {
        // 根据条件形成scripts标签
        if (trigger) {
            DOM_LIST.add(SCRIPT_HEAD + handlePath(path) + "\"" + SCRIPT_END);
        }
        return this;
    }

    // 构建script
    public DomBuilder script(String path, Map<String, String> map) {
        // 尾插Html元素形成scripts标签
        DOM_LIST.add(SCRIPT_HEAD + handlePath(path) + "\"" +
                map.entrySet().stream()
                        .map(entry -> " " + entry.getKey() + "=\"" + entry.getValue() + "\"")
                        .collect(Collectors.joining()) + SCRIPT_END);
        return this;
    }

    // 封装构造
    public String build() {
        return String.join("", DOM_LIST);
    }

    private DomBuilder() {}

    private String handlePath(String path) {
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return path;
    }

}
