<template>
  <div class="team-message-notification">
    <div class="title" v-html="title"></div>
    <div class="content" v-html="content"></div>
  </div>
</template>

<script>
import Message from "@/wfc/messages/message";
export default {
  name: "TeamMessageNotificationContentView",
  props: {
    message: {
      type: Message,
    },
  },
  data() {
    return {};
  },
  computed: {
    currentLanguage() {
      return this.$store.state.currentLanguage;
    },
    title() {
      let { title, titleEn } = this.message.messageContent.content;
      return this.currentLanguage === "en" ? titleEn || title : title;
    },
    content() {
      let { message, messageEn } = this.message.messageContent.content;
      return this.currentLanguage === "en" ? messageEn || message : message;
    },
  },
};
</script>

<style lang="less" scoped>
.team-message-notification {
  margin: 0 10px;
  padding: 16px;
  max-width: 500px;
  min-width: 250px;
  background-color: white;
  position: relative;
  border-radius: 5px;
  .title {
    font-size: 14px;
    color: #050505;
    line-height: 30px;
    white-space: pre-line;
  }
  .content {
    color: #666;
    white-space: pre-line;
    font-family: PingFang SC;
    font-size: 12px;
    line-height: 22px;
    font-weight: 400;
  }
  .content a {
    white-space: normal;
    color: #002754;
    font-family: PingFang SC;
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
  }
}
</style>
