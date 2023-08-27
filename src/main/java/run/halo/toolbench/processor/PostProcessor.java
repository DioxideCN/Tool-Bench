package run.halo.toolbench.processor;

import lombok.AllArgsConstructor;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.app.plugin.SettingFetcher;
import run.halo.app.theme.ReactivePostContentHandler;
import run.halo.toolbench.entity.PostReader;
import run.halo.toolbench.util.InferStream;
import run.halo.toolbench.util.PostUtil;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @author Dioxide.CN
 * @date 2023/8/27
 * @since 1.0
 */
@Component
@AllArgsConstructor
public class PostProcessor implements ReactivePostContentHandler {

    private final ReactiveSettingFetcher reactiveSettingFetcher;

    @Override
    public Mono<PostContentContext> handle(@NotNull final PostContentContext postContent) {
        return reactiveSettingFetcher
                .fetch("post", PostReader.class)
                .flatMap(config -> Mono.just(postContent)
                        .flatMap(pc -> {
                            String raw = pc.getRaw();
                            String content = pc.getContent();

                            Map<String, String> htmlMetas = new HashMap<>();
                            htmlMetas.put("count-words", String.valueOf(PostUtil.countWords(content)));
                            htmlMetas.put("count-images", String.valueOf(PostUtil.countImages(content)));
                            pc.getPost().getSpec().getHtmlMetas().add(htmlMetas);

                            String headCode = config.getHead() == null ? "" : config.getHead();
                            String tailCode = config.getTail() == null ? "" : config.getTail();

                            Set<String> prefixes = config.getCustomElementPrefix()
                                    .stream()
                                    .flatMap(map -> map.values().stream())
                                    .collect(Collectors.toSet());
                            String updatedContent = headCode +
                                    PostUtil.fixMarkdownAndElementTag(raw, prefixes) +
                                    tailCode;
                            postContent.setContent(updatedContent);
                            return Mono.just(pc);
                        }));
    }

}
