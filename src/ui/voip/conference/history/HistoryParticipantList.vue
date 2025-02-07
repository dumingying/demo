<template>
  <div class="history-participant-modal">
    <h4 class="title">
      {{ title }}
      <span @click="done">
        <Icon type="ios-close" style="font-size: 40px" />
      </span>
    </h4>
    <ul class="friend-list" v-if="participants">
      <li v-for="user in participants" :key="user.imMeetingParticipantUserId">
        <figure class="avatar-container">
          <img
            class="avatar"
            @error="mixinImgUrlAlt"
            draggable="false"
            :src="mixinDefaultPortrait(user.imMeetingParticipantPortrait)"
          />
        </figure>
        <span class="single-line name">
          {{ mixinResetPhoneNumber(user.imMeetingParticipantDisplayName) }}</span
        >
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    participants: {
      type: Array,
      require: true,
      default: () => {
        return [];
      },
    },
    title: { type: String, default: "" },
  },
  data() {
    return {};
  },
  methods: {
    done() {
      this.$modal.hide("HistoryParticipantList-modal");
    },
  },
};
</script>
<style lang="less" scoped>
.history-participant-modal {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #dafff3 0%, #ffffff 100%);
  border-radius: 12px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  position: relative;
  &::after {
    width: calc(100% - 60px);
    position: absolute;
    bottom: 30px;
    left: 30px;
    height: 54px;
    content: "";
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.5) 50%,
      #fff 100%
    );
    border-radius: 12px;
  }
  h4 {
    font-family: "Alibaba PuHuiTi";
    font-style: normal;
    font-weight: 400;
    font-size: 18px;
    line-height: 26px;
    text-align: center;
    color: #253456;
    span {
      position: absolute;
      top: 0;
      right: 0;
      height: 40px;
      line-height: 40px;
    }
  }
  .friend-list {
    background: #ffffff;
    border-radius: 12px;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 8px 40px;
    margin-top: 28px;
    flex: 1;
    filter: drop-shadow(0px 1px 8px rgba(0, 0, 0, 0.12));
    li {
      display: flex;
      align-items: center;
      margin-top: 16px;
      &:last-child {
        margin-bottom: 40px;
      }
      .avatar-container {
        width: 40px;
        height: 40px;
        display: block;
        margin-right: 12px;
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
