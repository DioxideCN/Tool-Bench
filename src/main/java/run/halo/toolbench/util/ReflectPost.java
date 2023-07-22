package run.halo.toolbench.util;

import com.vladsch.flexmark.ext.gfm.strikethrough.StrikethroughExtension;
import com.vladsch.flexmark.ext.tables.TablesExtension;
import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.util.data.MutableDataSet;
import lombok.extern.slf4j.Slf4j;
import org.thymeleaf.context.ITemplateContext;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author Dioxide.CN
 * @date 2023/7/20
 * @since 1.0
 */
public class ReflectPost {

    public static void handle(ITemplateContext context) {
        // 反射获取raw并修改content
        Object post = context.getVariable("post");
        if (post != null) {
            try {
                Field field = post.getClass().getDeclaredField("content");
                field.setAccessible(true);
                Object contentVo = field.get(post);
                // ContentVo.raw
                Field raw = contentVo.getClass().getDeclaredField("raw");
                raw.setAccessible(true);
                // ContentVo.content
                Field content = contentVo.getClass().getDeclaredField("content");
                content.setAccessible(true);
                // 修改contentPost的值
                String result = fixMarkdown((String) raw.get(contentVo));
                content.set(contentVo, result);
            } catch (NoSuchFieldException | IllegalAccessException e) {
                e.printStackTrace();
            }
        }
    }

    public static String fixMarkdown(String raw) {
        MutableDataSet options = new MutableDataSet();
        options.set(Parser.EXTENSIONS, Arrays.asList(TablesExtension.create(), StrikethroughExtension.create()));
        options.set(HtmlRenderer.FENCED_CODE_LANGUAGE_CLASS_PREFIX, "prism language-");
        Parser parser = Parser.builder(options).build();
        HtmlRenderer renderer = HtmlRenderer.builder(options).build();
        com.vladsch.flexmark.util.ast.Node document = parser.parse(raw);
        return renderer.render(document);
    }

}
