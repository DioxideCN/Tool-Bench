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
