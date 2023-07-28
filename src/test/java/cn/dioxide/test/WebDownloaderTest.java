package cn.dioxide.test;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;
import java.util.zip.GZIPInputStream;

/**
 * @author Dioxide.CN
 * @date 2023/7/28
 * @since 1.0
 */
public class WebDownloaderTest {

    private static final String FILE_URL = "https://cdn.jsdelivr.net/npm/geolite2-city@1.0.0/GeoLite2-City.mmdb.gz";
    private static final String CONFIG_HOME = "D:\\Coding\\Project\\plugin-tool-bench\\build\\libs"; // Replace this with your actual path

    public static void main(String[] args) {
        WebDownloaderTest downloader = new WebDownloaderTest();
        downloader.downloadAndUnzipFileAsync().join();
    }

    public CompletableFuture<String> downloadAndUnzipFileAsync() {
        String filePath = CONFIG_HOME + File.separator + "GeoLite2-City.mmdb.gz";
        String unzipPath = CONFIG_HOME + File.separator + "GeoLite2-City.mmdb";
        return CompletableFuture.supplyAsync(() -> downloadFile(filePath))
                .thenApply(path -> unzipFile(filePath, unzipPath))
                .whenComplete((unzippedPath, ex) -> {
                    if (ex != null) {
                        System.err.println("Error: " + ex.getMessage());
                    } else {
                        try {
                            System.out.println("正在删除压缩包");
                            Files.delete(Path.of(filePath));
                        } catch (IOException e) {
                            System.err.println("Error when deleting file: " + e.getMessage());
                        }
                    }
                });
    }

    private String downloadFile(String filePath) {
        HttpClient client = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.ALWAYS).build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(FILE_URL))
                .timeout(Duration.ofMinutes(1))
                .GET()
                .build();
        Path file = Path.of(filePath);
        try {
            System.out.println("正在下载");
            client.sendAsync(request, HttpResponse.BodyHandlers.ofFile(file))
                    .orTimeout(2, TimeUnit.MINUTES)
                    .exceptionally(ex -> {
                        throw new CompletionException("Failed to download file.", ex);
                    }).join();
        } catch (CompletionException ex) {
            for (int i = 0; true; i++) {
                try {
                    System.out.println("第" + (i+1) + "次重试");
                    client.sendAsync(request, HttpResponse.BodyHandlers.ofFile(file))
                            .orTimeout(2, TimeUnit.MINUTES)
                            .join();
                    break;
                } catch (CompletionException retryEx) {
                    if (i == 1) {
                        throw new CompletionException("Failed to download file after 3 attempts.", retryEx);
                    }
                }
            }
        }

        return filePath;
    }

    private String unzipFile(String filePath, String unzipPath) {
        try (GZIPInputStream gzipInputStream = new GZIPInputStream(new FileInputStream(filePath));
             FileChannel outputChannel = FileChannel.open(Path.of(unzipPath), StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {
            System.out.println("下载完成开始解压");
            byte[] buffer = new byte[1024];
            ByteBuffer byteBuffer = ByteBuffer.wrap(buffer);
            int length;
            while ((length = gzipInputStream.read(buffer)) != -1) {
                byteBuffer.clear();
                byteBuffer.limit(length);
                outputChannel.write(byteBuffer);
            }
        } catch (IOException e) {
            throw new CompletionException("Unable to unzip file", e);
        }

        return unzipPath;
    }

}
