package run.halo.toolbench.entity;

import lombok.*;

import java.util.LinkedHashMap;
import java.util.List;

/**
 * @author Dioxide.CN
 * @date 2023/7/21
 * @since 1.0
 */
@Data
@Getter
@Setter
@ToString
@EqualsAndHashCode
public class RendererReader {
    Boolean antvG2;
    Boolean antvX6;
    LinkedHashMap<String, String> codeHead;
    LinkedHashMap<String, String> codeTail;
    LinkedHashMap<String, String> prism;
    List<LinkedHashMap<String, String>> customElementPrefix;
}
