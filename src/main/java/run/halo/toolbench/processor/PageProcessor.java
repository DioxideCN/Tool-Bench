package run.halo.toolbench.processor;

import jakarta.annotation.Resource;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import run.halo.app.theme.ReactiveSinglePageContentHandler;
import run.halo.toolbench.infra.ProcessorHandler;

/**
 * @author Dioxide.CN
 * @date 2023/8/28
 * @since 1.0
 */
@Component
public class PageProcessor implements ReactiveSinglePageContentHandler {

    @Resource
    private ProcessorHandler processorHandler;

    @Override
    public Mono<SinglePageContentContext> handle(@NotNull final SinglePageContentContext singlePageContent) {
        return processorHandler.handlePageProcessor(singlePageContent);
    }

}
