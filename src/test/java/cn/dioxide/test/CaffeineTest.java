package cn.dioxide.test;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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
        Set<String> prefixes = new HashSet<>();
        prefixes.add("tool");
        prefixes.add("hao");
        prefixes.add("joe");
        String originalString = """
                <tool-msg type="success">在该标签中，X6对象的变量<code>width</code>和<code>height</code>支持TB表达式，但不支持<code>cwidth</code></tool-msg>
                """;
        System.out.println(fixElementTag(originalString, prefixes));
    }

    private static String fixElementTag(String content, Set<String> elemPrefixes) {
        String result = content;
        for (String prefix : elemPrefixes) {
            StringBuilder sb = new StringBuilder();
            Matcher matcher = Pattern.compile("&lt;(" + Pattern.quote(prefix) + "-.+?)&gt;(([\\s\\S])*?)&lt;/?(" + Pattern.quote(prefix) + "-.+?)&gt;", Pattern.DOTALL)
                    .matcher(result);
            while (matcher.find()) {
                String openingTag = matcher.group(1);
                String innerContent = matcher.group(2);
                String closingTag = matcher.group(4);
                String fullReplacement = "<" + openingTag + ">" +
                        innerContent.replaceAll("&lt;", "<").replaceAll("&gt;", ">") +
                        "</" + closingTag + ">";
                matcher.appendReplacement(sb, Matcher.quoteReplacement(fullReplacement));
            }
            matcher.appendTail(sb);
            result = sb.toString();
        }
        // 恢复<code>标签内的内容
        StringBuilder finalResult = new StringBuilder();
        Matcher finalCodeMatcher = Pattern.compile("<(code.*?)>(([\\s\\S])*?)</code>", Pattern.DOTALL).matcher(result);
        while (finalCodeMatcher.find()) {
            String openingTag = finalCodeMatcher.group(1);
            String replacement = finalCodeMatcher.group(2)
                    .replaceAll("<", "&lt;")
                    .replaceAll(">", "&gt;");
            finalCodeMatcher.appendReplacement(finalResult, Matcher.quoteReplacement("<" + openingTag + ">" + replacement + "</code>"));
        }
        finalCodeMatcher.appendTail(finalResult);
        return finalResult.toString();
    }

}
