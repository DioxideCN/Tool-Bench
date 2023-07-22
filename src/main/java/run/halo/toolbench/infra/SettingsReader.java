package run.halo.toolbench.infra;

import lombok.*;

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
public class SettingsReader {
    Boolean antvG2;
    Boolean antvX6;
    String directory;
    String githubToken;
}
