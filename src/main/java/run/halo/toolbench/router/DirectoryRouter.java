package run.halo.toolbench.router;

import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ReactiveSettingFetcher;

import java.util.Map;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

/**
 * @author Dioxide.CN
 * @date 2023/5/28
 * @since 1.0
 */
@Component
@AllArgsConstructor
public class DirectoryRouter {

    private final ReactiveSettingFetcher settingFetcher;
    private static final String TEMPLATE_ID_VARIABLE = "_templateId";

    @Bean
    RouterFunction<ServerResponse> directoryRouter() {
        return route(GET("/directory"),
                request -> ServerResponse.ok().render(
                    "directory",
                    Map.of(
                            TEMPLATE_ID_VARIABLE, "directory",
                            "title", Mono.fromCallable(() -> this.settingFetcher
                                    .get("basic").map(
                                            setting -> setting
                                                    .get("directory")
                                                    .asText("目录")
                                    ).defaultIfEmpty("目录"))
                    )
                )
        );
    }

}
