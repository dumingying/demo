<template>
  <div class="select-language-wrap">
    <div class="select-language">
      <p>{{ $t("setting.select_language") }}</p>
    </div>
    <div class="btn-wrap">
      <span class="btn cancel" @click="handleCancel">{{ $t("common.cancel") }}</span>
      <span class="btn join" @click="handleConfirm">{{ $t("common.confirm") }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "SelectLanguage",
  data() {
    return {};
  },
  methods: {
    handleCancel() {
      this.$modal.hide("SelectLanguage-modal");
    },
    handleConfirm() {
      this.$modal.hide("SelectLanguage-modal", { confirm: true });
    },
  },
};
</script>
<style lang="less" scoped>
.select-language-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  .select-language {
    width: 100%;
    flex: 1;
    overflow-y: auto;
    display: flex;
    align-items: center;
    justify-content: center;

    p {
      font-size: 16px;
      text-align: center;
    }
  }
  .btn-wrap {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    padding: 20px;
    .btn {
      font-size: 12px;
      text-align: center;
      min-width: 84px;
      margin: 0 10px;
      color: #515a6e;
      border-radius: 3px;
      height: 32px;
      line-height: 32px;
    }
    .cancel {
      border: 1px solid #ccc;
    }
    .join {
      color: #fff;
      background: #1dbb88;
    }
  }
}
</style>
