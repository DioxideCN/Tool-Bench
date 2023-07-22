package run.halo.toolbench.infra;

import jakarta.annotation.Resource;
import org.jetbrains.annotations.NotNull;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import run.halo.toolbench.ToolBenchPlugin;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

/**
 * @author Dioxide.CN
 * @date 2023/7/21
 * @since 1.0
 */
@Component
public class GraphQLReader {

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

}
