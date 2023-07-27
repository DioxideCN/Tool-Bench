package run.halo.toolbench.infra;

import jakarta.annotation.Resource;
import lombok.AllArgsConstructor;
import org.jetbrains.annotations.NotNull;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.toolbench.ToolBenchPlugin;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.stream.Stream;

/**
 * @author Dioxide.CN
 * @date 2023/7/21
 * @since 1.0
 */
@Component
@AllArgsConstructor
public class GraphQLReader {

    private final ReactiveSettingFetcher reactiveSettingFetcher;

    @Resource
    private ToolBenchPlugin PLUGIN;

    public String getGraphQL(String fileName) {
        Path queryPath = Paths.get(PLUGIN.getConfigContext().getCONFIG_HOME(), "graphql/" + fileName + ".graphql");
        return getFileContent(queryPath);
    }

    public String getVariables(String fileName) {
        Path variablesPath = Paths.get(PLUGIN.getConfigContext().getCONFIG_HOME(), "graphql/" + fileName + ".json");
        return getFileContent(variablesPath);
    }

    @NotNull
    private String getFileContent(Path filePath) {
        StringBuilder variablesBuilder = new StringBuilder();
        try (Stream<String> stream = Files.lines(filePath)) {
            stream.forEach(s -> variablesBuilder.append(s).append("\n"));
        } catch (IOException e) {
            e.printStackTrace();
        }
        return variablesBuilder.toString();
    }

    @NotNull
    public Mono<String> executeQuery(String owner, String repo, BiFunction<String, String, String> queryBuilder) {
        return this.reactiveSettingFetcher.get("basic")
                .map(setting -> setting.get("githubToken").asText("Github Token"))
                .flatMap(token -> WebClient.builder()
                        .baseUrl("https://api.github.com/graphql")
                        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .defaultHeader(HttpHeaders.AUTHORIZATION, "token " + token)
                        .build()
                        .post()
                        .bodyValue(Map.of(
                                "query", queryBuilder.apply(owner, repo)
                        ))
                        .retrieve()
                        .bodyToMono(String.class)
                );
    }

}
