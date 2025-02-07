<template>
  <div class="overflow-tip">
    <div class="content">
      <p>
        {{ type ? $t("voip.overflow_tip_1") : $t("voip.overflow_tip_2") }}
      </p>
    </div>
    <div class="btn-wrap">
      <span class="btn cancel" v-if="type" @click="handleCancel">{{
        $t("voip.cancel")
      }}</span>
      <span class="btn join" @click="handleJoin">{{
        type ? $t("common.agree") : $t("voip.i_known")
      }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "AudienceOverflowTip",
  props: {
    type: {
      type: String,
      default: "",
    },
  },
  data() {
    return {};
  },
  methods: {
    handleCancel() {
      this.$modal.hide("AudienceOverflowTip-modal");
    },
    handleJoin() {
      this.$modal.hide("AudienceOverflowTip-modal", true);
    },
  },
};
</script>
<style lang="less" scoped>
.overflow-tip {
  width: 100%;
  height: 100%;
  background-size: 80px;
  overflow: hidden;
  .content {
    height: 126px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 30px;
    background: #fff;
    border-radius: 12px;
    p {
      font-style: normal;
      font-weight: 400;
      font-size: 16px;
      line-height: 24px;
      color: #666666;
    }
  }
  .btn-wrap {
    height: 54px;
    display: flex;
    flex-direction: row;
    position: relative;
    &::after {
      position: absolute;
      left: 0;
      top: 0;
      content: "";
      width: 100%;
      height: 1px;
      background: #e6e6e6;
    }
    .btn {
      flex: 1;
      margin: 10px 0;
      font-size: 16px;
      line-height: 30px;
      text-align: center;
      color: #333333;
    }
    .cancel {
      border-right: 1px solid #f2f2f2;
    }
    .join {
      color: #1dbb88;
    }
  }
}
</style>
