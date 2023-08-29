package run.halo.toolbench.util;

import com.vladsch.flexmark.ext.gfm.strikethrough.StrikethroughExtension;
import com.vladsch.flexmark.ext.tables.TablesExtension;
import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.util.ast.Node;
import com.vladsch.flexmark.util.data.MutableDataSet;
import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author Dioxide.CN
 * @date 2023/8/27
 * @since 1.0
 */
@Slf4j
public class PostUtil {

    public static String fixMarkdownAndElementTag(String content, Set<String> elemPrefixes) {
        return fixElementTag(fixMarkdown(content), elemPrefixes);
    }

    public static String fixMarkdown(String raw) {
        MutableDataSet options = new MutableDataSet();
        options.set(Parser.EXTENSIONS, Arrays.asList(TablesExtension.create(), StrikethroughExtension.create()));
        options.set(HtmlRenderer.FENCED_CODE_LANGUAGE_CLASS_PREFIX, "prism language-");
        Parser parser = Parser.builder(options).build();
        HtmlRenderer renderer = HtmlRenderer.builder(options).build();
        Node document = parser.parse(raw);
        return renderer.render(document);
    }

    private static String fixElementTag(String content, Set<String> elemPrefixes) {
        String result = content;
        for (String prefix : elemPrefixes) {
            StringBuilder sb = new StringBuilder();
            // 如果带了相邻的p标签要将相邻的p标签移除
            Matcher matcher = Pattern
                    .compile("(?:<p>)?&lt;(" +
                            Pattern.quote(prefix) +
                            "-.+?)&gt;(([\\s\\S])*?)&lt;/?(" +
                            Pattern.quote(prefix) +
                            "-.+?)&gt;(?:</p>)?",
                            Pattern.DOTALL)
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

    public static int countWords(String htmlText) {
        return patternCounter(Pattern.compile("[a-zA-Z]+|[一-龥]"),
                htmlText.replaceAll("<[^>]+>", " "));
    }

    public static int countImages(String htmlText) {
        return patternCounter(Pattern.compile("<img [^>]*>", Pattern.CASE_INSENSITIVE),
                htmlText);
    }

    private static int patternCounter(Pattern pattern, String htmlText) {
        Matcher matcher = pattern.matcher(htmlText);
        int count = 0;
        while (matcher.find()) {
            count++;
        }
        return count;
    }

}
