package run.halo.toolbench.router;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ApiVersion;
import run.halo.toolbench.infra.GraphQLBuilder;
import run.halo.toolbench.infra.GraphQLReader;

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
public class GraphQLRouter {
    @Resource
    private GraphQLReader reader;

    // Update in 1.4EA07
    @GetMapping("/repository")
    public Mono<String> repositoryGraphqlQuery(@RequestParam String owner,
                                                 @RequestParam String repo) {
        return reader.executeQuery(owner, repo, GraphQLBuilder::getRepoInfo);
    }

    // Update in 1.4EA07
    @GetMapping("/discussions")
    public Mono<String> discussionsGraphqlQuery(@RequestParam String owner,
                                                  @RequestParam String repo) {
        return reader.executeQuery(owner, repo, GraphQLBuilder::getGiscusInfo);
    }
}