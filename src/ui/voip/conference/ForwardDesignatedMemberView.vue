<template>
  <div class="pick-contact-container">
    <section class="checked-contact-list-container">
      <h2>
        {{ othersMeeting ? $t("voip.private_meeting") : $t("voip.send_participants") }}
      </h2>
      <ul class="content" :style="{ maxHeight: othersMeeting ? '430px' : '350px' }">
        <li
          class="picked-user-container"
          v-for="(user, index) in designatedMember"
          :key="index"
        >
          <div class="picked-user">
            <img
              class="avatar"
              @error="mixinImgUrlAlt"
              draggable="false"
              :src="
                othersMeeting
                  ? user.portrait
                  : mixinDefaultPortrait(user._target.portrait)
              "
            />
          </div>
          <span class="name single-line">
            {{
              othersMeeting
                ? mixinHtmlEncode(
                    mixinResetPhoneNumber(user.nickname || $t("common.unknown_user"))
                  )
                : name(user)
            }}
          </span>
        </li>
      </ul>
      <ForwardMessageView
        v-if="!othersMeeting"
        ref="forwardMessageView"
        :forward-type="forwardType"
        :messages="messages"
      />
    </section>
    <footer v-if="!othersMeeting">
      <button @click="cancel" class="cancel">{{ $t("common.cancel") }}</button>
      <button
        @click="confirm"
        class="confirm"
        v-bind:class="{ disable: designatedMember.length === 0 }"
      >
        {{ confirmTitle }}
        ({{ designatedMember.length }})
      </button>
    </footer>
    <footer v-else>
      <button @click="cancel" class="confirm">
        {{ confirmTitle }}
      </button>
    </footer>
  </div>
</template>

<script>
import ForwardMessageView from "@/ui/main/conversation/message/forward/ForwardMessageView";
import ConversationType from "@/wfc/model/conversationType";
export default {
  name: "ForwardDesignatedMemberView",
  props: {
    designatedMember: {
      type: Array,
      required: true,
    },
    messages: {
      type: Array,
      required: true,
    },
    confirmTitle: {
      type: String,
      required: false,
      default: "confirm",
    },
    forwardType: {
      type: Number,
      required: false,
    },
    // 参会，非本人创建的会议仅仅展示头像
    othersMeeting: {
      type: Boolean,
      required: false,
    },
  },
  data() {
    return {};
  },
  created() {
    console.log(this.designatedMember);
  },
  computed: {
    name() {
      return (user) => {
        if (user.type === ConversationType.Group) {
          return user._target.name;
        }
        return this.mixinGetUserName(user._target);
      };
    },
  },
  methods: {
    cancel() {
      this.$modal.hide("forward-designated-member-modal", {
        confirm: false,
      });
    },
    confirm() {
      this.$modal.hide("forward-designated-member-modal", {
        confirm: true,
        extraMessageText: this.$refs["forwardMessageView"].extraMessageText,
      });
    },
  },
  components: { ForwardMessageView },
};
</script>

<style lang="css" scoped>
.pick-contact-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100%;
}
.checked-contact-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 0 15px;
}

.checked-contact-list-container h2 {
  height: 55px;
  line-height: 55px;
  font-size: 16px;
  font-weight: normal;
  text-align: center;
}

.checked-contact-list-container .content {
  max-height: 300px;
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: flex-start;
  align-content: flex-start;
  overflow-x: hidden;
  overflow-y: auto;
}

.checked-contact-list-container .content .picked-user-container {
  width: 25%;
  display: flex;
  flex-direction: column;
  column-count: 1;
  justify-content: center;
  align-content: center;
  padding: 5px 10px;
}

.checked-contact-list-container .content .picked-user-container .name {
  width: 100%;
  font-size: 12px;
  text-align: center;
}

.checked-contact-list-container .content .picked-user-container .picked-user {
  position: relative;
  height: 65px;
  width: 65px;
  margin: 0 auto;
}

.checked-contact-list-container .content .avatar {
  width: 45px;
  height: 45px;
  margin: 10px 10px;
  border-radius: 50%;
  overflow: hidden;
}

.checked-contact-list-container .content .unpick-button {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 1px solid white;
  border-radius: 10px;
  background-color: #f2f2f2;
  top: 0;
  right: 0;
}

.checked-contact-list-container .content .unpick-button:active {
  background-color: #e5e5e5;
}

.pick-contact-container footer {
  width: 100%;
  height: 55px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}

footer button {
  padding: 8px 30px;
  border-radius: 4px;
  margin: 0 10px;
  border: 1px solid #cccccc;
  background: transparent;
  color: #666;
}
footer button.cancel {
  background-color: #f7f7f7;
}
footer button.confirm {
  border: 1px solid #20bf64;
  background-color: #20bf64;
  color: #fff;
}

footer button.confirm.disable {
  background-color: #f2f2f2;
  color: #c2c2c2;
}
</style>
