package run.halo.toolbench.entity;

import com.nimbusds.jose.shaded.gson.annotations.SerializedName;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * @author Dioxide.CN
 * @date 2023/7/28
 * @since 1.0
 */
@Getter
@Setter
public class WeatherResponse {
    @SerializedName("location")
    private List<Location> location;

    @Getter
    @Setter
    public static class Location {
        @SerializedName("id")
        private String id;
        @SerializedName("name")
        private String name;
    }
}
