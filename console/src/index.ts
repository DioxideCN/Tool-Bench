import { definePlugin } from "@halo-dev/console-shared";
import { markRaw } from "vue";
import ToastEditor from "./components/ToastEditor.vue";

export default definePlugin({
  extensionPoints: {
    // @ts-ignore
    "editor:create": () => {
      return [
        {
          name: "toasteditor",
          displayName: "ToastEditor",
          component: markRaw(ToastEditor),
          rawType: "markdown",
        },
      ];
    },
  },
});
