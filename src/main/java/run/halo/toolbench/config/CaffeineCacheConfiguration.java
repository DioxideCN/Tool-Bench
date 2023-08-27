package run.halo.toolbench.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.annotation.Resource;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.app.plugin.SettingFetcher;
import run.halo.toolbench.router.QWeatherRouter;

import java.util.concurrent.TimeUnit;

/**
 * 为了避免前端暴露出来的接口被恶意刷取、盗用流量，需要配置Caffeine本地缓存。
 * 在这个配置类中Caffeine缓存主要负责对和风天气的查询结果进行缓存，缓存失效
 * 时间为10分钟，10分钟后会重新进入{@link QWeatherRouter#getWeatherData}方法调用远程拉取任务。
 * 由于拉取和风天气信息的业务划分为两个步骤，一个是根据IP获取城市ID，一个是
 * 根据城市ID获取天气信息，所以需要两层缓存，一个是缓存"城市ID"到"IP集合"
 * 的缓存，另一个是缓存"城市ID"到"天气信息"的缓存，两个缓存具有关联性。
 *
 * @author Dioxide.CN
 * @date 2023/8/5
 * @since 1.0
 */
@Slf4j
@Configuration
public class CaffeineCacheConfiguration {
    @Resource
    private SettingFetcher settingFetcher;

    // ip到城市ID
    @Bean(name = "ipToCityIDCache")
    public Cache<String, String> ipToCityIDCache() {
        return Caffeine.newBuilder()
                        .expireAfterWrite(30, TimeUnit.MINUTES)
                        .maximumSize(1_000)
                        .build();
    }

    // 城市ID到天气信息
    @Bean(name = "cityIDToWeatherCache")
    public Cache<String, JsonNode> cityIDToWeatherCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .maximumSize(1_000)
                .build();
    }
}
