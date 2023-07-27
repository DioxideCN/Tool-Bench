package run.halo.toolbench.infra;

import org.jetbrains.annotations.NotNull;

/**
 * @author Dioxide.CN
 * @date 2023/7/21
 * @since 1.0
 */
public class GraphQLBuilder {

    static final String repository = """
            {
              repository(owner:"{owner}", name:"{repo}") {
                name
                description
                url
                createdAt
                updatedAt
                primaryLanguage {
                  name
                  color
                }
                stargazerCount
                licenseInfo {
                  nickname
                }
                forks {
                  totalCount
                }
                issues(states:OPEN) {
                  totalCount
                }
                pullRequests(states:OPEN) {
                  totalCount
                }
                ref(qualifiedName: "main") {
                  target {
                    ... on Commit {
                      history(first: 30) {
                        nodes {
                          committedDate
                        }
                      }
                    }
                  }
                }
              }
            }""";

    static final String discussions = """
            {
              repository(owner:"{owner}", name:"{repo}") {
                discussions(first: 5, orderBy: {field: UPDATED_AT, direction: DESC}) {
                  edges {
                    node {
                      title
                      comments(first: 5) {
                        edges {
                          node {
                            author {
                              login
                              avatarUrl
                            }
                            bodyText
                            createdAt
                          }
                        }
                      }
                    }
                  }
                }
              }
            }""";

    public static String getRepoInfo(@NotNull String owner, @NotNull String repo) {
        return repository.replace("{owner}", owner).replace("{repo}", repo);
    }

    public static String getGiscusInfo(@NotNull String owner, @NotNull String repo) {
        return discussions.replace("{owner}", owner).replace("{repo}", repo);
    }

}
