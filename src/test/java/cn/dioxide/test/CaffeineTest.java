package cn.dioxide.test;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.junit.jupiter.api.Test;

import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author Dioxide.CN
 * @date 2023/8/27
 * @since 1.0
 */
public class CaffeineTest {

    @Test
    public void cacheUnit() {
        String htmlText = "<h1>Title</h1><p>This is a <strong>paragraph</strong>.</p>";
        String plainText = htmlText.replaceAll("<[^>]+>", " ");
        String regex = "[a-zA-Z]+|[\u4e00-\u9fa5]";
        Matcher matcher = Pattern.compile(regex).matcher(plainText);
        int count = 0;
        while (matcher.find()) {
            count++;
        }
        System.out.println(count);
    }

    @Test
    public void replaceTest() {
        // 假设这是您的原始字符串，其中包含了 HTML 实体
        String originalString = "This is a test string with &lt;tool-mtitle th=123&gt;&lt;/tool-mtitle&gt; tags.";

        Matcher matcher = Pattern.compile("&lt;(/tool-.*?|tool-.*?)&gt;").matcher(originalString);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String replacement = matcher.group(1).replaceAll("&lt;", "<").replaceAll("&gt;", ">");
            matcher.appendReplacement(sb, "<" + replacement + ">");
        }
        matcher.appendTail(sb);

        // 现在您可以进一步处理这些特殊的 "tool-" 开头的标签
        System.out.println("Restored string: " + sb.toString());
    }

}
