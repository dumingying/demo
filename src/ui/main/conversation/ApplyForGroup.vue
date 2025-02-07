<!-- 申请入群 -->

<template>
  <div class="apply-group">
    <p class="content">{{ $t("group.manage") }}</p>
    <input type="text" class="input" v-model="sendText" />
    <div class="footer">
      <button @click="close">{{ $t("common.cancel") }}</button>
      <button @click="send">{{ $t("common.send") }}</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "ApplyForGroup",
  components: {},
  data() {
    return {
      sendText: "",
    };
  },
  methods: {
    close() {
      this.$modal.hide("applyForGroup-modal");
    },
    send() {
      this.$modal.hide("applyForGroup-modal", {
        sendText: this.sendText,
        confirm: true,
      });
    },
  },
};
</script>
<style lang="less" scoped>
.apply-group {
  p {
    padding: 30px 20px 20px;
    font-size: 14px;
    color: #000;
  }
  .input {
    width: calc(100% - 40px);
    margin: 0 20px 10px;
    border: none;
    background: #f1f1f1;
    border-radius: 5px;
    overflow: hidden;
    height: 40px;
    line-height: 30px;
    font-size: 14px;
    outline: none;
    padding: 0 5px;
    &:focus {
      outline: none;
    }
  }
  .footer {
    padding: 10px;
    font-size: 14px;
    border-top: 1px solid #ececec;
    button {
      width: 50%;
      line-height: 40px;
      display: inline-block;
      border: none;
      background: #fff;
      color: #1dbb88;
      font-weight: bold;
      &:first-child {
        border-right: 1px solid #ececec;
        color: #666;
        font-weight: normal;
      }
    }
  }
}
</style>
