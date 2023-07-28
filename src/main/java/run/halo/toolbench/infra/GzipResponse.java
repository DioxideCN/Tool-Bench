package run.halo.toolbench.infra;

import com.google.common.io.CharStreams;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.io.InputStreamReader;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;
import java.util.zip.GZIPInputStream;

/**
 * @author Dioxide.CN
 * @date 2023/7/28
 * @since 1.0
 */
public class GzipResponse {

    public static Mono<String> handle(HttpClient client, HttpRequest request) {
        return Mono.fromCompletionStage(client.sendAsync(request, HttpResponse.BodyHandlers.ofInputStream()))
                .flatMap(response -> Mono.fromCompletionStage(
                        // 展平并委派给CompletableFuture处理
                        CompletableFuture.supplyAsync(() -> {
                            // 为了解决在响应式链路中close发生异步阻塞这里使用CompletableFuture来解决
                            try (GZIPInputStream gzipInputStream = new GZIPInputStream(response.body());
                                 InputStreamReader reader = new InputStreamReader(gzipInputStream, StandardCharsets.UTF_8)) {
                                return CharStreams.toString(reader);
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                        })
                ));
    }

}
