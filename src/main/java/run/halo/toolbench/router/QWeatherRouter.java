package run.halo.toolbench.router;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.annotation.Resource;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@ApiVersion("v1alpha1")
@RequestMapping("/weather")
@RestController
@AllArgsConstructor
public class QWeatherRouter {
    @Resource
    private GeoLiteReader reader;

    private final ReactiveSettingFetcher reactiveSettingFetcher;

    @GetMapping("/get")
    public Mono<JsonNode> getCurrentCityWeather(ServerWebExchange exchange) {
        InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
        if (remoteAddress == null) return Mono.empty();
        String clientIp = remoteAddress.getAddress().getHostAddress();
        return this.reactiveSettingFetcher.get("basic")
                .map(setting -> setting.get("qWeatherPrivateKey").asText(""))
                .flatMap(key -> {
                    if (key.isEmpty()) return Mono.empty();
                    return reader.getCityCode(clientIp, key)
                            .flatMap(cityInfo -> getWeatherData(cityInfo.cityId(), key)
                                    .map(weatherData -> {
                                        ObjectMapper mapper = new ObjectMapper();
                                        ObjectNode result = mapper.createObjectNode();
                                        result.put("cityName", cityInfo.cityName());
                                        result.set("weatherData", weatherData);
                                        return result;
                                    })
                            );
                });
    }

    private Mono<JsonNode> getWeatherData(String cityCode, String key) {
        HttpClient client = HttpClient.newHttpClient();
        URI uri = URI.create(String.format("https://devapi.qweather.com/v7/weather/now?location=%s&key=%s",
                cityCode,
                URLEncoder.encode(key, StandardCharsets.UTF_8)));
        HttpRequest request = HttpRequest
                .newBuilder()
                .uri(uri)
                .GET()
                .build();
        // 处理成json对象返回给前端
        return GzipResponse.handle(client, request)
                .flatMap(responseBody -> {
                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        return Mono.just(mapper.readTree(responseBody));
                    } catch (JsonProcessingException e) {
                        return Mono.error(e);
                    }
                });
    }

}
