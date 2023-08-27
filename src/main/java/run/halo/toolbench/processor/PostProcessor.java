package run.halo.toolbench.processor;

import lombok.AllArgsConstructor;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.SettingFetcher;
import run.halo.app.theme.ReactivePostContentHandler;
import run.halo.toolbench.entity.PostReader;
import run.halo.toolbench.util.InferStream;
import run.halo.toolbench.util.PostUtil;

import java.util.HashMap;
import java.util.Map;

/**
 * @author Dioxide.CN
 * @date 2023/8/27
 * @since 1.0
 */
@Component
@AllArgsConstructor
public class PostProcessor implements ReactivePostContentHandler {

    private final SettingFetcher settingFetcher;

    @Override
    public Mono<PostContentContext> handle(@NotNull final PostContentContext postContent) {
        return settingFetcher
                .fetch("post", PostReader.class)
                .map(config -> {
                    boolean enableCountMeta = config.isEnableCountMeta();
                    String raw = postContent.getRaw();
                    String content = postContent.getContent();

                    Map<String, String> htmlMetas = new HashMap<>();
                    htmlMetas.put("count-words", enableCountMeta ? String.valueOf(PostUtil.countWords(content)) : "-1");
                    htmlMetas.put("count-images", enableCountMeta ? String.valueOf(PostUtil.countImages(content)) : "-1");
                    postContent.getPost().getSpec().getHtmlMetas().add(htmlMetas);

                    String updatedContent = config.getHead() +
                            (config.isEnableToolElement() ? PostUtil.fixMarkdownAndElementTag(raw) : content) +
                            config.getTail();
                    postContent.setContent(updatedContent);
                    return Mono.just(postContent);
                })
                .orElse(Mono.empty());
    }


}
