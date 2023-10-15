package cn.dioxide.test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jetbrains.annotations.NotNull;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import run.halo.toolbench.infra.GraphQLBuilder;

import java.util.Map;
import java.util.function.BiFunction;

/**
 * @author Dioxide.CN
 * @date 2023/10/15
 * @since 1.4
 */
public class GraphQLText {

    private ObjectMapper objectMapper = new ObjectMapper();

    private static final String TOKEN = "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";

    @Test
    public void queryUnitTest() {
        // can't cast ObjectNode to JsonNode in production env in Halo 2.10
        Mono<JsonNode> res = query();
        System.out.println(res.block());
    }

    public Mono<JsonNode> query() {
        Mono<String> res = this.executeQuery("jiewenhuang",
                "halo-theme-macwen",
                GraphQLBuilder::getRepoInfo);
        return res.flatMap(jsonString -> {
            try {
                JsonNode jsonNode = objectMapper.readTree(jsonString);
                return Mono.just(jsonNode);
            } catch (Exception e) {
                return Mono.empty();
            }
        });
    }

    @NotNull
    public Mono<String> executeQuery(String owner, String repo, BiFunction<String, String, String> queryBuilder) {
        return WebClient.builder()
                    .baseUrl("https://api.github.com/graphql")
                    .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "token " + TOKEN)
                    .build()
                    .post()
                    .bodyValue(Map.of(
                            "query", queryBuilder.apply(owner, repo)
                    ))
                    .retrieve()
                    .bodyToMono(String.class);
    }

}
