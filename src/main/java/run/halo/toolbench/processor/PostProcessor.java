package run.halo.toolbench.processor;

import jakarta.annotation.Resource;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import run.halo.app.theme.ReactivePostContentHandler;
import run.halo.toolbench.infra.ProcessorHandler;

/**
 * @author Dioxide.CN
 * @date 2023/8/27
 * @since 1.0
 */
@Component
public class PostProcessor implements ReactivePostContentHandler {

    @Resource
    private ProcessorHandler processorHandler;

    @Override
    public Mono<PostContentContext> handle(@NotNull final PostContentContext postContent) {
        return processorHandler.handlePostProcessor(postContent);
    }

}
