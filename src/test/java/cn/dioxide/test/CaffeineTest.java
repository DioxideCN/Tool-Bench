package cn.dioxide.test;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.junit.jupiter.api.Test;

import java.util.concurrent.TimeUnit;

/**
 * @author Dioxide.CN
 * @date 2023/8/27
 * @since 1.0
 */
public class CaffeineTest {

    @Test
    public void cacheUnit() {
        Cache<String, String> cache = Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(1_000)
                .build();
        cache.put("demo", "value");
        System.out.println(cache.getIfPresent("demo"));
        System.out.println(System.getProperty("java.version"));
    }

}
