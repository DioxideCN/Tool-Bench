import { definePlugin } from "@halo-dev/console-shared";
import { markRaw } from "vue";
import LucenceEngine from "./components/LucenceEngine.vue";

export default definePlugin({
  extensionPoints: {
    // @ts-ignore
    "editor:create": () => {
      return [
        {
          name: "lucenceengine",
          displayName: "LucenceEngine",
          component: markRaw(LucenceEngine),
          rawType: "markdown",
        },
      ];
    },
  },
});
