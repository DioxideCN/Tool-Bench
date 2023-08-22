# Tool-Bench
Tool Bench插件为Halo 2.x博客集成更多标签样式与功能支持

## 指南
- 插件指南：https://dioxide-cn.ink/archives/about-tool-bench
- 样式指南：https://dioxide-cn.ink/archives/tool-bench-style

## 使用方式
1. 下载，目前提供以下下载方式：
    - GitHub Releases：访问 [Releases](https://github.com/DioxideCN/Tool-Bench/releases) 下载 Assets 中的 JAR 文件。
2. 安装，插件安装和更新方式可参考：https://docs.halo.run/user-guide/plugins。

## 开发环境
```shell
git clone git@github.com:DioxideCN/Tool-Bench.git

# 或者当你 fork 之后

git clone git@github.com:{your_github_id}/Tool-Bench.git
```

```shell
cd path/to/Tool-Bench
```

```shell
# macOS / Linux
./gradlew build

# Windows
./gradlew.bat build
```

修改 Halo 配置文件：

```yaml
halo:
  plugin:
    runtime-mode: development
    classes-directories:
      - "build/classes"
      - "build/resources"
    lib-directories:
      - "libs"
    fixedPluginPath:
      - "/path/to/Tool-Bench"
```

## 开发ToolBench
开发ToolBench插件前你必须具备熟练的 JavaScript 和 Java Reactor 知识，以下是本插件的框架结构：

1. `ToolBenchPlugin`类为插件加载入口
   插件被挂载后会在第一时间调用 Spring Configuration `ConfigFolderConfiguration` 类完成包括：初始化插件配置目录、释放基本配置、远程拉取任务的工作
2. `router`包分配了自定义的 Halo 接口，同时与资源目录下的 `roleTemplate.yaml` 互相形成完整的权限组
3. `util/DomBuilder`类提供了链式的前端 dom 构建工具
4. `util/InferStream`类提供了响应式流形式的条件判断框架
5. `util/ReflectPost`类提供了反射获取文章原文内容（Markdown化前的）的方法
6. `infra`包中提供了关于解析配置文件中的 GraphQL 文件能力的类
7. `CaffeiniCacheConfiguration`类提供了本地缓存的能力来降低前端频繁请求接口的压力
