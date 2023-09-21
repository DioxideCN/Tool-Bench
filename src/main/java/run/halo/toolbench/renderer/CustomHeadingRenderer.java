package run.halo.toolbench.renderer;

import com.vladsch.flexmark.ast.Heading;
import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.html.HtmlWriter;
import com.vladsch.flexmark.html.renderer.NodeRenderer;
import com.vladsch.flexmark.html.renderer.NodeRendererContext;
import com.vladsch.flexmark.html.renderer.NodeRendererFactory;
import com.vladsch.flexmark.html.renderer.NodeRenderingHandler;
import com.vladsch.flexmark.util.data.DataHolder;
import com.vladsch.flexmark.util.data.MutableDataHolder;
import com.vladsch.flexmark.util.sequence.BasedSequence;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.HashSet;
import java.util.Set;

/**
 * @author Dioxide.CN
 * @date 2023/8/30
 * @since 1.0
 */
public class CustomHeadingRenderer implements NodeRenderer {
    public CustomHeadingRenderer(DataHolder options) {
    }

    @Override
    public @Nullable Set<NodeRenderingHandler<?>> getNodeRenderingHandlers() {
        Set<NodeRenderingHandler<?>> set = new HashSet<>();
        set.add(new NodeRenderingHandler<>(Heading.class, this::render));
        return set;
    }

    private void render(Heading heading, NodeRendererContext context, HtmlWriter html) {
        BasedSequence text = heading.getText();
        html.withAttr()
                .attr("id", text)
                .tag("h" + heading.getLevel());
        context.renderChildren(heading);
        html.tag("/h" + heading.getLevel());
    }

    public static class Factory implements HtmlRenderer.HtmlRendererExtension {
        @Override
        public void rendererOptions(@NotNull MutableDataHolder options) {
        }

        @Override
        public void extend(HtmlRenderer.@NotNull Builder htmlRendererBuilder, @NotNull String rendererType) {
            htmlRendererBuilder.nodeRendererFactory(new NodeRendererFactory() {
                @Override
                public @NotNull NodeRenderer apply(@NotNull DataHolder options) {
                    return new CustomHeadingRenderer(options);
                }
            });
        }
    }
}
