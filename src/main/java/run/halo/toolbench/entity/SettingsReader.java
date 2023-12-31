package run.halo.toolbench.entity;

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
    String directory;
    String githubToken;
}
