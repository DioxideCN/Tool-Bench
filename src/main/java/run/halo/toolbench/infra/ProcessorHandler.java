package run.halo.toolbench.infra;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.app.theme.ReactivePostContentHandler;
import run.halo.app.theme.ReactiveSinglePageContentHandler;
import run.halo.toolbench.entity.RendererReader;
import run.halo.toolbench.util.PostUtil;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * @author Dioxide.CN
 * @date 2023/8/28
 * @since 1.0
 */
@Slf4j
@Component
@AllArgsConstructor
public class ProcessorHandler {

    private final ReactiveSettingFetcher reactiveSettingFetcher;

    private static final String CODE_EXTENSION_FOR_POST = "codeForPost";
    private static final String CODE_EXTENSION_FOR_PAGE = "codeForPage";

    @NotNull
    public Mono<ReactivePostContentHandler.PostContentContext> handlePostProcessor(
            @NotNull ReactivePostContentHandler.PostContentContext postContentContext) {
        return this.doProcess(postContentContext,
                ReactivePostContentHandler.PostContentContext::getContent,
                ReactivePostContentHandler.PostContentContext::getRaw,
                postContentContext::setContent,
                postContentContext.getPost().getSpec().getHtmlMetas()::add,
                CODE_EXTENSION_FOR_POST);
    }

    @NotNull
    public Mono<ReactiveSinglePageContentHandler.SinglePageContentContext> handlePageProcessor(
            @NotNull ReactiveSinglePageContentHandler.SinglePageContentContext singlePageContentContext) {
        return this.doProcess(singlePageContentContext,
                ReactiveSinglePageContentHandler.SinglePageContentContext::getContent,
                ReactiveSinglePageContentHandler.SinglePageContentContext::getRaw,
                singlePageContentContext::setContent,
                singlePageContentContext.getSinglePage().getSpec().getHtmlMetas()::add,
                CODE_EXTENSION_FOR_PAGE);
    }

    @NotNull
    private <T> Mono<T> doProcess(@NotNull T contentContext,
                                  @NotNull Function<T, String> getContent,
                                  @NotNull Function<T, String> getRaw,
                                  @NotNull Consumer<String> setContent,
                                  @NotNull Consumer<Map<String, String>> addHtmlMetas,
                                  @NotNull final String extensionForWhich) {
        return reactiveSettingFetcher
                .fetch("post", RendererReader.class)
                .flatMap(config -> Mono.just(contentContext)
                        .flatMap(cc -> {
                            String raw = getRaw.apply(cc);
                            String content = getContent.apply(cc);
                            Map<String, String> htmlMetas = new HashMap<>();
                            htmlMetas.put("count-words", String.valueOf(PostUtil.countWords(content)));
                            htmlMetas.put("count-images", String.valueOf(PostUtil.countImages(content)));
                            addHtmlMetas.accept(htmlMetas);
                            Set<String> prefixes = config.getCustomElementPrefix()
                                    .stream()
                                    .flatMap(map -> map.values().stream())
                                    .collect(Collectors.toSet());
                            // 对raw文本处理是因为有的编辑器会将自定义标签移除，如ByteMD
                            String headCode = handleHeadCode(config.getCodeHead(), extensionForWhich);
                            String tailCode = handleHeadCode(config.getCodeTail(), extensionForWhich);
                            String updatedContent = headCode +
                                    PostUtil.fixMarkdownAndElementTag(raw, prefixes) +
                                    tailCode;
                            setContent.accept(updatedContent);
                            return Mono.just(cc);
                        }));
    }

    @NotNull
    private String handleHeadCode(@NotNull final LinkedHashMap<String, String> codeOnWhichMap,
                                  @NotNull final String extensionForWhich) {
        String codeRule = codeOnWhichMap.getOrDefault("rule", "none");
        String extensionCode = "";
        if ("all".equals(codeRule)) {
            // 两者公用
            extensionCode = codeOnWhichMap.getOrDefault("codeForBoth", "");
        } else if (extensionForWhich.equals(CODE_EXTENSION_FOR_POST)) {
            if ("post".equals(codeRule)) {
                // 为post页面启用
                extensionCode = codeOnWhichMap.getOrDefault(CODE_EXTENSION_FOR_POST, "");
            } else if ("isolation".equals(codeRule)) {
                extensionCode = codeOnWhichMap.getOrDefault(CODE_EXTENSION_FOR_POST, "");
            }
        } else if (extensionForWhich.equals(CODE_EXTENSION_FOR_PAGE)) {
            if ("page".equals(codeRule)) {
                // 为page页面启用
                extensionCode = codeOnWhichMap.getOrDefault(CODE_EXTENSION_FOR_PAGE, "");
            } else if ("isolation".equals(codeRule)) {
                extensionCode = codeOnWhichMap.getOrDefault(CODE_EXTENSION_FOR_PAGE, "");
            }
        }
        return extensionCode;
    }

}
