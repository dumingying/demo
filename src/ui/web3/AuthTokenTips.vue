<template>
  <div class="auth-token-wrap">
    <h4 class="title">
      <span class="name">{{ title }}</span>
    </h4>
    <div class="content">
      <p>
        {{ $t("login.auth_tip_1") }}
        <span @click="handler" style="color: #1dbb88"> {{ $t("login.auth_tip_2") }}</span>
        {{ $t("login.auth_tip_3") }}
      </p>
    </div>
    <div class="footer">
      <button class="cancel" @click="close">{{ $t("common.close") }}</button>
    </div>
  </div>
</template>

<script>
import { getItem } from "@/ui/util/storageHelper";
export default {
  props: {
    title: {
      type: String,
      default: "",
    },
  },
  components: {},
  data() {
    return {};
  },
  computed: {
    isEn() {
      return this.$store.state.currentLanguage === "en";
    },
  },
  methods: {
    handler() {
      let url = isEn
        ? `${this.mixinHttps}/privacyDetailEn.html`
        : `${this.mixinHttps}/privacyDetailZh.html`;
      this.$alert({
        title: this.$t("login.auth_tip_2"),
        width: 640,
        height: 430,
        content: `<iframe style="width:600px;height:300px;border:none;" src="${url}"></iframe>`,
        isText: false,
        confirmText: this.$t("common.close"),
        cancelText: "",
      });
    },
    close() {
      this.$modal.hide("AuthTokenTips-modal");
    },
  },
};
</script>
<style lang="less" scoped>
.auth-token-wrap {
  height: 100%;
  padding: 24px 30px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    text-align: center;
    font-size: 14px;
    color: #1dbb88;
    position: relative;
    .name {
      flex: 1;
      font-size: 16px;
    }
    .btn-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      right: 0;
    }
    .close-btn {
      margin-left: 8px;
      color: #dddddd;
    }
    .tip-btn {
      display: inline-block;
      width: 20px;
      height: 20px;
      background: url(../../assets/images/tip-btn.png) no-repeat center center;
      background-size: 100%;
    }
  }
  .content {
    font-size: 12px;
    line-height: 24px;
  }

  .footer {
    display: flex;
    justify-content: center;
    align-items: center;
    border-top: 1px solid #eee;
    padding-top: 10px;
  }

  .footer button {
    max-width: 100px;
    flex: 1;
    font-size: 14px;
    padding: 8px 15px;
    border-radius: 4px;
    background: none;
    text-align: center;
    border: none;
    margin-top: 10px;
    color: #1dbb88;
  }

  .footer .cancel {
    background: #dddddd;
  }
}
</style>
