package run.halo.toolbench.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * @author Dioxide.CN
 * @date 2023/8/5
 * @since 1.0
 */
@Configuration
public class CaffeineCacheConfiguration<K, V> {

    @Bean
    public Cache<K, V> caffeineConfig() {
        return Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.HOURS)
                .maximumSize(100)
                .build();
    }

}
