package run.halo.toolbench.router;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.benmanes.caffeine.cache.Cache;
import jakarta.annotation.Resource;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ApiVersion;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.toolbench.config.CaffeineCacheConfiguration;
import run.halo.toolbench.infra.GeoLiteReader;
import run.halo.toolbench.infra.GzipResponse;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * {@link QWeatherRouter}提供了最基本的拉取和风天气API的能力，这个获取过程
 * 是完全异步响应式的，在进行二次开发与修改时需要注意响应式流的编程规范。
 * 拉取和风天气API主要分为3个步骤：
 * <ul>
 * <li>从Nginx传递的{@code X-Forwarded-For}或{@code X-Real-IP}解析出真实IP地址，并将这个IP地址传递给{@link GeoLiteReader}进行解析得到经纬度</li>
 * <li>将得到的经纬度传递给{@link GeoLiteReader#getCityCode}方法从和风天气拉取到这个经纬度所在的城市ID</li>
 * <li>将得到的城市ID传递给{@link #getWeatherData}方法从和风天气再次拉取这个城市的天气情况</li>
 * </ul>
 * 一次请求最多需要消耗2次和风天气的Token，所以考虑到可能会有用户恶意盗刷流量所以这里使用Caffeine
 * 做一次本地缓存，来缓解频繁请求API的压力，本地缓存具体见{@link CaffeineCacheConfiguration}类。
 *
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
    @Resource
    private Cache<String, String> ipToCityIDCache;
    @Resource
    private Cache<String, JsonNode> cityIDToWeatherCache;

    private final ReactiveSettingFetcher reactiveSettingFetcher;

    @GetMapping("/get")
    public Mono<JsonNode> getCurrentCityWeather(ServerWebExchange exchange) {
        HttpHeaders headers = exchange.getRequest().getHeaders();
        return Mono.justOrEmpty(
                Optional.ofNullable(headers.getFirst("X-Forwarded-For"))
                        .or(() -> Optional.ofNullable(headers.getFirst("X-Real-IP")))
                        .or(() -> Optional.ofNullable(exchange
                                        .getRequest()
                                        .getRemoteAddress())
                                        .map(remoteAddress -> remoteAddress.getAddress().getHostAddress())
                        ))
                .flatMap(ip -> this.reactiveSettingFetcher.get("basic")
                        .flatMap(setting -> {
                            String key = setting.get("qWeatherPrivateKey").asText("");
                            if (key.isEmpty()) return Mono.empty();
                            return Mono.defer(() -> {
                                        String cityID = ipToCityIDCache.getIfPresent(ip);
                                        if (cityID == null) return Mono.empty();
                                        JsonNode weather = cityIDToWeatherCache.getIfPresent(cityID);
                                        if (weather == null) return Mono.empty();
                                        return Mono.just(weather);
                                    })
                                    .switchIfEmpty(
                                            reader.getCityCode(ip, key)
                                                    .flatMap(cityInfo -> {
                                                        ipToCityIDCache.put(ip, cityInfo.cityId());
                                                        return getWeatherData(cityInfo.cityId(), key)
                                                                .map(weatherData -> {
                                                                    ObjectMapper mapper = new ObjectMapper();
                                                                    ObjectNode result = mapper.createObjectNode();
                                                                    result.put("cityName", cityInfo.cityName());
                                                                    result.set("weatherData", weatherData);
                                                                    cityIDToWeatherCache.put(cityInfo.cityId(), result);
                                                                    return (JsonNode) result;
                                                                });
                                                    })
                                    );
                        })
                );
    }


    @NotNull
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
