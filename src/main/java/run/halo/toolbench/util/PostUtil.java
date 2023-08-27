package run.halo.toolbench.util;

import com.vladsch.flexmark.ext.gfm.strikethrough.StrikethroughExtension;
import com.vladsch.flexmark.ext.tables.TablesExtension;
import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.util.ast.Node;
import com.vladsch.flexmark.util.data.MutableDataSet;

import java.util.Arrays;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author Dioxide.CN
 * @date 2023/8/27
 * @since 1.0
 */
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

    public static String fixElementTag(String content, Set<String> elemPrefixes) {
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
