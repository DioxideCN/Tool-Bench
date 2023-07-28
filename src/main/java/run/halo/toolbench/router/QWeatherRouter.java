package run.halo.toolbench.router;

import jakarta.annotation.Resource;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ApiVersion;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.toolbench.infra.GeoLiteReader;
import run.halo.toolbench.infra.GzipResponse;

import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.nio.charset.StandardCharsets;

/**
 * @author Dioxide.CN
 * @date 2023/7/28
 * @since 1.0
 */
@ApiVersion("v1alpha1")
@RequestMapping("/weather")
@RestController
@AllArgsConstructor
public class QWeatherRouter {
    @Resource
    private GeoLiteReader reader;

    private final ReactiveSettingFetcher reactiveSettingFetcher;

    @GetMapping("/get")
    public Mono<String> getCurrentCityWeather(ServerWebExchange exchange) {
        InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
        if (remoteAddress == null) return Mono.empty();
        String clientIp = remoteAddress.getAddress().getHostAddress();
        return this.reactiveSettingFetcher.get("basic")
                .map(setting -> setting.get("qWeatherPrivateKey").asText(""))
                .flatMap(key -> {
                    if (key.isEmpty()) return Mono.empty();
                    return reader.getCityCode(clientIp, key)
                            .flatMap(code -> getWeatherData(code, key));
                });
    }

    private Mono<String> getWeatherData(String cityCode, String key) {
        HttpClient client = HttpClient.newHttpClient();
        URI uri = URI.create(String.format("https://devapi.qweather.com/v7/weather/3d?location=%s&key=%s",
                cityCode,
                URLEncoder.encode(key, StandardCharsets.UTF_8)));
        HttpRequest request = HttpRequest
                .newBuilder()
                .uri(uri)
                .GET()
                .build();
        return GzipResponse.handle(client, request);
    }

}
