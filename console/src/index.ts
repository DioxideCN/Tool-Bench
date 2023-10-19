import {definePlugin, type EditorProvider} from "@halo-dev/console-shared";
import {markRaw} from "vue";
import LucenceEngine from "./components/LucenceEngine.vue";
import logo from './assets/logo.svg'

export default definePlugin({
    extensionPoints: {
        "editor:create": (): EditorProvider[] => {
            return [
                {
                    name: "lucence-editor",
                    displayName: "Lucence编辑器",
                    // @ts-ignore
                    component: markRaw(LucenceEngine),
                    rawType: "markdown",
                    logo: logo,
                },
            ];
        },
    },
});
