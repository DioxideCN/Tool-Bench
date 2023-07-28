package run.halo.toolbench.infra;

import com.maxmind.geoip2.DatabaseReader;
import com.nimbusds.jose.shaded.gson.Gson;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import run.halo.toolbench.ToolBenchPlugin;
import run.halo.toolbench.entity.WeatherResponse;

import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
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
@Component
public class GeoLiteReader {

    @Resource
    private ToolBenchPlugin PLUGIN;

    public Mono<String> getCityCode(String ip, final String key) {
        File database = new File(PLUGIN.getConfigContext().getCONFIG_HOME() + File.separator + "GeoLite2-City.mmdb");
        try {
            // build方法应该配合try-with-resource但是会被自动关闭链接导致整个Mono无法再从数据库获取数据
            DatabaseReader dbReader = new DatabaseReader.Builder(database).build();
            // getByName()请求DNS会在该异步模型中发生阻塞
            InetAddress ipAddress = InetAddress.getByName(ip);
            return Mono.fromCallable(() -> dbReader.city(ipAddress))
                    .flatMap(response -> getCityIdFromLatLon(
                            response.getLocation().getLatitude().toString(),
                            response.getLocation().getLongitude().toString(),
                            key
                    ));
        } catch (IOException e) {
            return Mono.error(e);
        }
    }

    /**
     * 依据传入的IP经纬度请求和风天气API获取城市ID
     * @param latitude 纬度
     * @param longitude 经度
     * @return String类型的响应式体
     */
    private Mono<String> getCityIdFromLatLon(String latitude, String longitude, final String key) {
        HttpClient client = HttpClient.newHttpClient();
        URI uri = URI.create(String.format("https://geoapi.qweather.com/v2/city/lookup?location=%s&key=%s",
                URLEncoder.encode(longitude + "," + latitude, StandardCharsets.UTF_8),
                URLEncoder.encode(key, StandardCharsets.UTF_8)));
        HttpRequest request = HttpRequest
                .newBuilder()
                .uri(uri)
                .GET()
                .build();
        // 让整个请求过程发生在响应式链路中避免阻塞
        return GzipResponse.handle(client, request)
                .flatMap(this::parseCityId);
    }

    /**
     * Gson处理异步过来的HttpResponse
     * @param responseBody 经过GZIP解压缩的JSON格式的HttpResponse字符串
     * @return 返回一个从HttpResponse中获取城市ID的响应式体
     */
    private Mono<String> parseCityId(String responseBody) {
        return Mono.fromCallable(() -> {
            Gson gson = new Gson();
            WeatherResponse response = gson.fromJson(responseBody, WeatherResponse.class);
            return response.getLocation().get(0).getId();
        });
    }

}
