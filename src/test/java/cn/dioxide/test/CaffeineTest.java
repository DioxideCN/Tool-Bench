package cn.dioxide.test;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
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
                This is a test string with &lt;tool-mtitle th=123&gt;&lt;/tool-mtitle&gt; tags.
                This is a test string with &lt;joe-mtitle th=123&gt;&lt;/joe-mtitle&gt; tags.
                This is a test string with &lt;hao-mtitle th=123&gt;&lt;/hao-mtitle&gt; tags.
                """;
        System.out.println(fixElementTag(originalString, prefixes));
    }

    private static String fixElementTag(String content, Set<String> elemPrefixes) {
        String result = content;
        for (String prefix : elemPrefixes) {
            StringBuilder sb = new StringBuilder();
            Matcher matcher =
                    Pattern.compile("&lt;(/" + prefix + "-.*?|" + prefix + "-.*?)&gt;")
                            .matcher(result);
            while (matcher.find()) {
                String replacement = matcher.group(1).replaceAll("&lt;", "<").replaceAll("&gt;", ">");
                matcher.appendReplacement(sb, "<" + replacement + ">");
            }
            matcher.appendTail(sb);
            result = sb.toString();
        }
        return result;
    }

}
