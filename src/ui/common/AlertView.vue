<template>
  <section class="alert-content-container">
    <h2 v-if="title" class="title" v-html="title"></h2>
    <div class="content-wrap">
      <template v-if="tipContent">
        <div v-if="isText" class="content">{{ tipContent }}</div>
        <div v-else class="content" @click="handleClick" v-html="tipContent"></div>
      </template>
    </div>
    <div class="action-container">
      <button
        :style="styles && styles.cancelBtn"
        class="cancel"
        @click="cancel"
        v-html="cancelText"
        v-if="cancelText"
      ></button>
      <button
        class="confirm"
        @click="confirm"
        v-if="confirmText"
        v-html="confirmText"
      ></button>
    </div>
  </section>
</template>

<script>
import { ipcRenderer } from "@/platform";
import { getItem } from "../util/storageHelper";
let isEn = getItem("lang") === "en";
export default {
  name: "AlertView",
  props: {
    title: {
      type: String,
      required: false,
      default: "",
    },
    tipContent: {
      type: String,
      required: false,
      default: "",
    },
    cancelText: {
      type: String,
      required: false,
      default: isEn ? "Cancel" : "取消",
    },
    confirmText: {
      type: String,
      required: false,
      default: isEn ? "Confirm" : "确定",
    },
    cancelCallback: {
      type: Function,
      required: false,
    },
    confirmCallback: {
      type: Function,
      required: false,
    },
    isText: {
      type: Boolean,
      default: false,
    },
    isMainWindow: {
      type: Boolean,
      default: true,
    },
    styles: {
      type: Object,
      default: () => {},
    },
  },
  methods: {
    cancel(type) {
      this.$modal.hide("alert-modal", { cancel: true, type });
    },

    confirm() {
      this.$modal.hide("alert-modal", { confirm: true });
    },
    handleClick(e) {
      if (e.target.className === "open-link") {
        if (this.isMainWindow) {
          this.mixinGo2Web3View(e.target.dataset.link);
          this.cancel(1);
        } else {
          ipcRenderer.send("message-history-openUrl", {
            urlAddress: e.target.dataset.link,
          });
        }
      }
    },
  },
};
</script>

<style scoped>
.alert-content-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.title {
  padding-top: 10px;
  text-align: center;
  font-size: 18px;
  line-height: 40px;
  font-weight: 600;
  color: #000;
}
.content-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.content {
  max-height: 100%;
  overflow: auto;
  font-size: 14px;
  line-height: 24px;
  color: #333;
  padding: 20px;
  word-break: break-word;
  text-align: center;
  box-sizing: border-box;
}

.action-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #eee;
  padding: 10px 0;
}

.action-container button {
  flex: 1;
  font-size: 14px;
  padding: 5px;
  border-radius: 4px;
  background: none;
  text-align: center;
  /* border: 1px solid #cccccc; */
  border: none;
  margin: 0 10px;
  color: #666;
}

.action-container .cancel {
  background: #fff;
}

.action-container .confirm {
  color: #1dbb88;
  font-weight: bold;
  position: relative;

  /* background: #2d8cf0; */
  /* color: #fff; */
  /* border: 1px solid #2d8cf0; */
}
.action-container .confirm:after {
  content: "";
  background: #eee;
  width: 1px;
  height: 20px;
  position: absolute;
  left: -10px;
}
/* .action-container .cancel:active {
  background: white;
  color: white;
}

.action-container .confirm:active {
  background: #2d8cf0;
  color: white;
} */
</style>
