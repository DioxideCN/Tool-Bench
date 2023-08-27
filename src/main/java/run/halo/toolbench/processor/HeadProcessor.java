package run.halo.toolbench.processor;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.ITemplateContext;
import org.thymeleaf.model.IModel;
import org.thymeleaf.model.IModelFactory;
import org.thymeleaf.processor.element.IElementModelStructureHandler;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.SettingFetcher;
import run.halo.app.theme.dialect.TemplateHeadProcessor;
import run.halo.toolbench.entity.SettingsReader;
import run.halo.toolbench.util.DomBuilder;
import run.halo.toolbench.util.InferStream;

import java.util.Map;

@Component
@AllArgsConstructor
public class HeadProcessor implements TemplateHeadProcessor {

    private final SettingFetcher settingFetcher;
    private static final String TEMPLATE_ID_VARIABLE = "_templateId";

    @Override
    public Mono<Void> process(ITemplateContext context, IModel model,
                              IElementModelStructureHandler structureHandler) {
        final IModelFactory modelFactory = context.getModelFactory();
        // 全响应式链路
        return InferStream
                // 独立或文章页 JS
                .<Void>infer(true)
                .success(() -> settingFetcher
                        .fetch("basic", SettingsReader.class)
                        .map(config -> {
                            model.add(modelFactory.createText(
                                    DomBuilder.use()
                                            .style("/css/tool-bench.css")
                                            .script("/lib/FormatterInit.js", Map.of(
                                                    "id", "formatter-init",
                                                    "data-g2-enable", config.getAntvG2().toString(),
                                                    "data-x6-enable", config.getAntvX6().toString()))
                                            .script("/native/g2.min.js", config.getAntvG2())
                                            .script("/native/x6.min.js", config.getAntvX6())
                                            .script("/lib/CustomDom.js")
                                            .build()));
                            return Mono.empty();
                        })
                        .orElse(Mono.empty()).then())
                // 目录页 JS
                .infer(whichTemplate(context, "directory"))
                .success(() -> model.add(modelFactory.createText(
                        DomBuilder.use()
                                .script("/native/pinyin-pro.min.js")
                                .script("/lib/DirectorySort.js")
                                .build())))
                .last();
    }

    public boolean whichTemplate(ITemplateContext context, String template) {
        return template.equals(context.getVariable(TEMPLATE_ID_VARIABLE));
    }

}
