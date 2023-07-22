package run.halo.toolbench.router;

import jakarta.annotation.Resource;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ApiVersion;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.app.plugin.SettingFetcher;
import run.halo.toolbench.infra.GraphQLBuilder;
import run.halo.toolbench.infra.GraphQLReader;
import run.halo.toolbench.infra.SettingsReader;

import java.util.HashMap;
import java.util.Map;

/**
 * make halo support request graphql api from
 * some websites like LeetCode, Twitter, GitHub
 *
 * @author Dioxide.CN
 * @date 2023/7/21
 * @since 1.0
 */
@ApiVersion("v1alpha1")
@RequestMapping("/github")
@RestController
@AllArgsConstructor
public class GraphQLRouter {
    @Resource
    private GraphQLReader reader;

    private final ReactiveSettingFetcher reactiveSettingFetcher;

    // this controller we use full reactive stream
    @GetMapping("/repository")
    public Mono<String> graphqlQuery(@RequestParam String owner,
                                     @RequestParam String repo) {
        return this.reactiveSettingFetcher.get("basic")
                .map(setting -> setting.get("githubToken").asText("Github Token"))
                .flatMap(token -> WebClient.builder()
                        // use https://api.github.com/graphql for test unit
                        .baseUrl("https://api.github.com/graphql")
                        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .defaultHeader(HttpHeaders.AUTHORIZATION, "token " + token)
                        .build()
                        .post()
                        .bodyValue(Map.of(
                                "query", GraphQLBuilder.getRepoInfo(owner, repo)
                        ))
                        .retrieve()
                        .bodyToMono(String.class)
                );
    }
}