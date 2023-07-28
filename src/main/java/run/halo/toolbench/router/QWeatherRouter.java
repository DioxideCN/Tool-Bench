package run.halo.toolbench.router;

import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import run.halo.app.plugin.ApiVersion;

/**
 * @author Dioxide.CN
 * @date 2023/7/28
 * @since 1.0
 */
@ApiVersion("v1alpha1")
@RequestMapping("/weather")
@RestController
@AllArgsConstructor
public class QWeatherRouter {



}
