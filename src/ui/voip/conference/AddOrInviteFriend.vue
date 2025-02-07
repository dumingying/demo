<template>
  <div class="add-invite-friend-modal">
    <h4 class="title">
      {{ title }}
      <span @click="done">
        <Icon type="ios-close" style="font-size: 40px" />
      </span>
    </h4>
    <ul class="friend-list">
      <li v-for="user in users" :key="user.uid">
        <figure class="avatar-container">
          <img
            class="avatar"
            @error="mixinImgUrlAlt"
            draggable="false"
            :src="mixinDefaultPortrait(user.portrait)"
          />
        </figure>
        <span class="single-line name">
          {{ mixinGetUserName(user) || $t("common.user") }}</span
        >
      </li>
    </ul>
    <div class="send-btn">
      <span @click="send">{{
        type ? $t("voip.invite_confirm") : $t("voip.send_request")
      }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    users: { type: Array },
    type: { type: Number },
    title: { type: String },
  },
  data() {
    return {};
  },
  methods: {
    done() {
      this.$modal.hide("AddOrInviteFriend-modal");
    },
    // 点击发送
    send() {
      this.$modal.hide("AddOrInviteFriend-modal", {
        confirm: true,
        type: this.type,
      });
    },
  },
};
</script>
<style lang="less" scoped>
.add-invite-friend-modal {
  width: 100%;
  height: 100%;
  background: #fff;
  padding: 15px 20px;
  display: flex;
  flex-direction: column;

  h4 {
    text-align: center;
    vertical-align: middle;
    font-size: 16px;
    position: relative;
    height: 40px;
    line-height: 40px;
    span {
      position: absolute;
      top: 0;
      right: 0;
      height: 40px;
      line-height: 40px;
    }
  }
  .friend-list {
    overflow-y: auto;
    padding: 0 8px;
    flex: 1;
    li {
      display: flex;
      align-items: center;
      margin-top: 10px;
      .avatar-container {
        width: 40px;
        height: 40px;
        display: blocks;
        margin-right: 10px;
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }
      }
      .name {
        flex: 1;
        display: block;
      }
    }
  }
  .send-btn {
    margin: 16px 20px 20px;
    height: 40px;
    border-radius: 4px;
    background: #1dbb88;
    font-weight: bold;
    color: #fff;
    text-align: center;
    line-height: 40px;
    font-size: 14px;
  }
}
</style>
