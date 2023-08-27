package run.halo.toolbench;

import org.pf4j.PluginWrapper;
import org.springframework.stereotype.Component;
import run.halo.app.plugin.BasePlugin;
import run.halo.toolbench.config.ConfigFolderConfiguration;

/**
 * @author DioxideCN
 * @since 2.0.0
 */
@Component
public class ToolBenchPlugin extends BasePlugin {

    private final ConfigFolderConfiguration configFolderConfiguration;

    public ToolBenchPlugin(ConfigFolderConfiguration configFolderConfiguration) {
        super();
        this.configFolderConfiguration = configFolderConfiguration;
    }

    @Override
    public void start() {
        this.configFolderConfiguration.init(ToolBenchPlugin.class);
    }

    public ConfigFolderConfiguration getConfigContext() {
        return configFolderConfiguration;
    }

}
