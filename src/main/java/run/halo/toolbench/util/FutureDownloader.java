package run.halo.toolbench.util;

import lombok.extern.slf4j.Slf4j;

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
@Slf4j
public class FutureDownloader {

    private final String FILE_URL;
    private final String DIRECTION;

    private FutureDownloader(String FILE_URL, String DIRECTION) {
        this.FILE_URL = FILE_URL;
        this.DIRECTION = DIRECTION;
    }

    public static void call(String direction, String requestUrl) {
        FutureDownloader futureDownloader = new FutureDownloader(requestUrl, direction);
        futureDownloader.downloadAndUnzipFileAsync();
    }

    // 远程异步拉取mmdb数据库到本地
    private void downloadAndUnzipFileAsync() {
        String filePath = DIRECTION + File.separator + "GeoLite2-City.mmdb.gz";
        String unzipPath = DIRECTION + File.separator + "GeoLite2-City.mmdb";
        // check if file already exists
        if (Files.exists(Path.of(unzipPath))) {
            log.info("detected file GeoLite2-City.mmdb at {}", unzipPath);
            return;
        }
        CompletableFuture.supplyAsync(() -> downloadFile(filePath))
                .thenApply(path -> unzipFile(filePath, unzipPath))
                .whenComplete((unzippedPath, ex) -> {
                    if (ex != null) {
                        log.error(ex.getMessage());
                    } else {
                        try {
                            log.info("deleting gz file GeoLite2-City.mmdb.gz");
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
            log.info("start downloading gz file GeoLite2-City.mmdb.gz from server");
            client.sendAsync(request, HttpResponse.BodyHandlers.ofFile(file))
                    .orTimeout(2, TimeUnit.MINUTES)
                    .exceptionally(ex -> {
                        throw new CompletionException("Failed to download file.", ex);
                    }).join();
        } catch (CompletionException ex) {
            for (int i = 0; true; i++) {
                try {
                    log.info("download failed, retrying for the {} time.", (i+1));
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

    @SuppressWarnings("all")
    private String unzipFile(String filePath, String unzipPath) {
        try (GZIPInputStream gzipInputStream = new GZIPInputStream(new FileInputStream(filePath));
             FileChannel outputChannel = FileChannel.open(Path.of(unzipPath), StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {
            log.info("gz file GeoLite2-City.mmdb.gz has been successfully downloaded, start unpacking");
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
