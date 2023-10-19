package cn.dioxide.test;

import org.junit.jupiter.api.Test;
import run.halo.toolbench.util.PostUtil;

import java.util.HashSet;

/**
 * @author Dioxide.CN
 * @date 2023/10/19
 * @since 1.0
 */
public class MarkdownTest {

    static final String rawContext = """
            <link rel="stylesheet" href="/plugins/plugin-katex/assets/static/katex.min.css">
            <script defer src="/plugins/plugin-katex/assets/static/katex.min.js"></script>
            <script>
                document.addEventListener("DOMContentLoaded", function() {
                  const postBody = document.body
                  const renderMath = (selector,displayMode) => {
                    const els = postBody.querySelectorAll(selector)
                    els.forEach((el) => {
                      katex.render(el.innerText, el, { displayMode })
                    })
                  }
                  if (postBody) {
                    renderMath("[math-inline]",false);
                    renderMath("[math-display]",true);
                  }
                });
            </script>
            
            # Heading 1
            """;

    @Test
    public void renderTest() {
        String s = PostUtil.fixMarkdownAndElementTag(rawContext, new HashSet<>());
        System.out.println(s);
    }

}
