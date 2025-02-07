<template>
  <section class="screen-window-picker-container" ref="contentContainer">
    <h2 class="title">{{ $t("voip.choose_share") }}</h2>
    <div class="category-container">
      <div
        class="category"
        v-bind:class="{ active: this.currentCategory === 'screen' }"
        @click="setCategory('screen')"
      >
        {{ $t("common.desktop") }}
      </div>
      <div
        class="category"
        v-bind:class="{ active: this.currentCategory === 'window' }"
        @click="setCategory('window')"
      >
        {{ $t("common.window") }}
      </div>
    </div>
    <div class="source-container">
      <div
        :key="source.id"
        v-for="(source, index) in currentCategory === 'screen'
          ? screenSources
          : windowSources"
        class="source"
        v-bind:class="{ active: selectedSource && selectedSource.id === source.id }"
        @click="selectSource(source)"
        @dblclick="share($event, source)"
      >
        <div class="thumbnail">
          <img :src="toRaw(source).thumbnail.toDataURL()" draggable="false" />
        </div>
        <div class="source-icon-name-container">
          <img
            class="icon"
            v-if="source.appIcon"
            :src="toRaw(source).appIcon.toDataURL()"
            draggable="false"
          />
          <p v-if="currentCategory === 'screen'" class="name single-line">
            {{ $t("common.desktop") + (index + 1) }}
          </p>
          <p v-else class="name single-line">{{ toRaw(source).name }}</p>
        </div>
      </div>
    </div>
    <div class="action-container">
      <button @click="cancel">{{ $t("common.cancel") }}</button>
      <button
        @click="share"
        :class="{ disabled: !this.selectedSource }"
        :disabled="!this.selectedSource"
      >
        {{ $t("voip.share") }}
      </button>
    </div>
  </section>
</template>

<!--only for electron-->
<script>
import { desktopCapturer } from "@/platform";

import { setItem } from "@/ui/util/storageHelper";
import { toRaw } from "vue";

export default {
  name: "ScreenOrWindowPicker",
  data() {
    return {
      currentCategory: "screen", // window
      selectedSource: "",
      screenSources: [],
      /*id: "window:94694:0"
            name: "微信 (聊天)"
            thumbnail: NativeImage {}
            display_id: ""
            appIcon: NativeImage {}
             */
      windowSources: [],
    };
  },

  methods: {
    toRaw,
    selectSource(source) {
      this.selectedSource = source;
    },

    setCategory(category) {
      if (this.currentCategory !== category) {
        this.currentCategory = category;
        this.selectedSource = null;
        let width = category === "screen" ? "50%" : "33%";
        this.$refs.contentContainer.style.setProperty("--source-width", width);
      }
    },

    cancel() {
      this.$modal.hide("screen-window-picker-modal");
      setItem("source", false);
    },

    share() {
      if (!this.selectedSource) return;
      let source = toRaw(this.selectedSource);
      this.$modal.hide("screen-window-picker-modal", { source });
      source && setItem("shareScreenInfo", JSON.stringify(source)); // 记录共享的名称title
      setItem("source", true);
    },
  },

  mounted() {
    let types = ["screen", "window"];
    desktopCapturer
      .getSources({
        types: types,
        thumbnailSize: { width: 200, height: 200 },
        fetchWindowIcons: true,
      })
      .then((sources) => {
        // console.log('sources', sources)
        this.screenSources = sources.filter((source) => {
          console.log(source);
          return toRaw(source).id.startsWith("screen");
        });
        // 默认设置选中第一个桌面
        this.selectedSource = this.screenSources[0];
        this.windowSources = sources.filter((source) => source.id.startsWith("window"));
      });
  },
};
</script>

<style scoped lang="css">
.screen-window-picker-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 20px;
  --source-width: 50%;
}

.category-container {
  display: flex;
}

.category {
  font-size: 16px;
  flex: 1;
  text-align: center;
  padding: 5px;
}

.category.active {
  color: #1dbb88;
  border-bottom: 2px solid #1dbb88;
  filter: none;
}

.title {
  text-align: center;
}
.source-container {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  flex-wrap: wrap;
  overflow-y: scroll;
  border: 1px solid lightgrey;
  width: 100%;
}

.source {
  margin-top: 5px;
  width: var(--source-width);
  height: 200px;
  padding: 5px;
  border: 2px solid #fff;
  box-sizing: border-box;
}

.source.active {
  border: 2px solid #1dbb88;
}

.source .thumbnail {
  margin: 10px;
  height: 120px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.source .source-icon-name-container {
  padding: 10px;
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.source-icon-name-container .icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}

.action-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.action-container button {
  width: 100px;
  padding: 10px 25px;
  border-radius: 3px;
  font-size: 15px;
  background: none;
  border: none;
  margin-left: 20px;
}
.action-container button:nth-child(1) {
  border: 1px solid #999;
  color: #999;
}
.action-container button:nth-child(2) {
  border: 1px solid #1dbb88;
  color: #1dbb88;
}
.action-container button:hover {
  cursor: pointer;
}
.action-container button:nth-child(1):hover {
  border: 1px solid #1dbb88;
  color: #1dbb88;
}
.action-container button:nth-child(2):hover {
  background: #1dbb88;
  color: #fff;
}

.action-container button.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
