<template>
  <div class="screen-share-tip">
    <h4>{{ title }}</h4>
    <div class="disclaimer-info">
      <i18n-t keypath="voip.screen_share_tip">
        <template v-slot:action>
          <strong> {{ $t("voip.share_tip_content") }}</strong>
        </template>
      </i18n-t>
      <span :class="['disclaimer-not-btn', notTip ? 'active' : '']" @click="nextNotTip">
        {{ $t("voip.no_longer_prompt") }}
      </span>
    </div>
    <div class="btn-wrap">
      <span class="btn cancel" @click="handleCancel">{{ $t("common.cancel") }}</span>
      <span :class="['btn', 'confirm']" @click="handleConfirm">{{
        $t("voip.start_share")
      }}</span>
    </div>
  </div>
</template>

<script>
import { setItem, removeItem } from "@/ui/util/storageHelper";
export default {
  name: "ScreenShareTip",
  props: {
    title: {
      type: String,
      default: "",
    },
  },
  components: {},
  data() {
    return {
      timer: null,
      num: 60,
      notTip: false,
    };
  },
  created() {},
  methods: {
    handleCancel() {
      this.$modal.hide("ScreenShareTip-modal", 0);
      this.timer && clearTimeout(this.timer);
    },
    handleConfirm() {
      this.notTip
        ? setItem("show_disclaimer_info", 1)
        : removeItem("show_disclaimer_info");
      this.$modal.hide("ScreenShareTip-modal", 1);
    },
    nextNotTip() {
      this.notTip = !this.notTip;
    },
  },
  unmounted() {
    this.timer && clearTimeout(this.timer);
  },
};
</script>
<style lang="less" scoped>
.screen-share-tip {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  h4 {
    font-size: 18px;
    text-align: center;
    display: block;
    line-height: 30px;
    color: #f40;
    padding-top: 15px;
  }
  .disclaimer-info {
    flex: 1;
    overflow-y: auto;
    text-align: left;
    padding: 0 20px;
    margin-top: 10px;
    font-size: 14px;
    line-height: 24px;
    strong {
      font-weight: bold;
      color: #f40;
    }
  }

  .disclaimer-info .disclaimer-not-btn {
    position: relative;
    padding-left: 14px;
    margin-top: 10px;
    font-size: 12px;
    min-width: 100px;
    display: block;
    padding-left: 18px;
  }

  .disclaimer-info .disclaimer-not-btn::before {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    content: "";
    width: 12px;
    height: 12px;
    border: 1px solid #1dbb88;
    border-radius: 50%;
    box-sizing: border-box;
    -webkit-transform: translateY(-50%);
    -moz-transform: translateY(-50%);
    -ms-transform: translateY(-50%);
    -o-transform: translateY(-50%);
    -webkit-border-radius: 50%;
    -moz-border-radius: 50%;
    -ms-border-radius: 50%;
    -o-border-radius: 50%;
  }

  .disclaimer-info .active {
    position: relative;
  }

  .disclaimer-info .active::before {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    border-radius: 50%;
    content: "";
    width: 12px;
    height: 12px;
    /*background:#2F8CF0;
    */
    border: 1px solid #1dbb88;
    -webkit-transform: translateY(-50%);
    -moz-transform: translateY(-50%);
    -ms-transform: translateY(-50%);
    -o-transform: translateY(-50%);
    -webkit-border-radius: 50%;
    -moz-border-radius: 50%;
    -ms-border-radius: 50%;
    -o-border-radius: 50%;
  }

  .disclaimer-info .active::after {
    position: absolute;
    left: 2px;
    top: 50%;
    transform: translateY(-50%);
    border-radius: 50%;
    content: "";
    width: 8px;
    height: 8px;
    background: #1dbb88;
    border: 1px solid #1dbb88;
    -webkit-transform: translateY(-50%);
    -moz-transform: translateY(-50%);
    -ms-transform: translateY(-50%);
    -webkit-border-radius: 50%;
    -moz-border-radius: 50%;
    -ms-border-radius: 50%;
    -o-border-radius: 50%;
    -o-transform: translateY(-50%);
  }
  .btn-wrap {
    margin-top: 10px;
    padding: 10px 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    text-align: center;
    border-top: 1px solid #ccc;
    .btn {
      flex: 1;
      color: #515a6e;
      height: 30px;
      line-height: 30px;
      cursor: pointer;
      font-size: 16px;
    }
    .cancel {
      border-right: 1px solid #ccc;
      color: #999;
    }
    .confirm {
      color: #1dbb88;
      font-weight: bold;
      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}
</style>
