package cn.dioxide.test;

import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import run.halo.toolbench.util.InferStream;

import java.util.List;
import java.util.concurrent.Callable;

/**
 * @author Dioxide.CN
 * @date 2023/7/20
 * @since 1.0
 */
public class InferStreamTest {

    @Test
    public void doTest() {
        test().forEach(mono -> System.out.println(mono.block()));
    }

    public static List<Mono<String>> test() {
        return InferStream.<String>infer(true)
                // 非独立页面或非文章页面
                .success(() -> Mono.just("true"))
                .fail(() -> Mono.just("false"))
                .infer(1 > 2)
                .collect();
    }

}
