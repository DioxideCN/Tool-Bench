package run.halo.toolbench.router;

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

    // this controller we use full reactive stream
    @GetMapping("/repository")
    public Mono<String> repositoryGraphqlQuery(@RequestParam String owner,
                                     @RequestParam String repo) {
        return reader.executeQuery(owner, repo, GraphQLBuilder::getRepoInfo);
    }

    @GetMapping("/discussions")
    public Mono<String> discussionsGraphqlQuery(@RequestParam String owner,
                                     @RequestParam String repo) {
        return reader.executeQuery(owner, repo, GraphQLBuilder::getGiscusInfo);
    }
}