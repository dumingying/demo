<template>
  <section :class="['container', from]">
    <div class="barrage-header-wrap" v-if="from === 'large'">
      <span class="back" v-if="name !== 'page'" @click="goBack">
        <Icon type="ios-arrow-back" />
      </span>
      {{ $t("common.conversation") }}
    </div>
    <div class="content-list" ref="messageWrap">
      <ul class="message-list" ref="message-list" infinite-wrapper>
        <infinite-loading force-use-infinite-wrapper v-if="loading" direction="top">
          <template #no-more>{{ $t("conversation.no_more_message") }}</template>
          <template #no-results>{{ $t("conversation.all_message_load") }}</template>
        </infinite-loading>
        <li
          v-for="message in currentChatRoomMessageList"
          :key="message.messageId"
          :class="own(message)"
        >
          <p v-if="message._showTime && from === 'large'" class="time">
            {{ message._timeStr }}
          </p>
          <div class="message-wrap">
            <img
              class="avatar"
              draggable="false"
              v-if="from === 'large'"
              @error="mixinImgUrlAlt"
              :src="mixinDefaultPortrait(message._from.portrait)"
            />
            <div class="text-wrap">
              <span
                class="user-name"
                v-if="(!own(message) && from === 'large') || from === 'small'"
                >{{ resetDisplayName(message) }}</span
              >
              <p class="text" v-html="textContent(message)"></p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
import ConversationInfo from "@/wfc/model/conversationInfo";
import InfiniteLoading from "@imndx/vue-infinite-loading";

import { parser as emojiParse } from "@/ui/util/emoji";
import wfc from "@/wfc/client/wfc";

export default {
  name: "BarrageMessageContentView",
  props: {
    currentConversationInfo: {
      type: ConversationInfo,
      required: true,
      default: null,
    },
    currentChatRoomMessageList: {
      type: Array,
      required: true,
      default: [],
    },
    from: {
      type: String,
    },
    name: {
      type: String,
    },
  },
  data() {
    return {
      loading: false,
    };
  },
  components: {
    InfiniteLoading,
  },
  computed: {
    resetDisplayName() {
      return (message) => {
        let name = message._from.displayName || message._from.mobile;
        if (/^1[3|4|5|7|8|9][0-9]{9}$/.test(name)) {
          name = this.mixinResetPhoneNumber(name);
        }
        return this.from === "small" ? `${name} :` : name;
      };
    },
    textContent() {
      return (message) => {
        if (message.messageContent.digest) {
          let tmp = emojiParse(message.messageContent.digest(message));
          // pls refer to https://stackoverflow.com/questions/4522124/replace-leading-spaces-with-nbsp-in-javascript
          tmp = tmp.replace(/^[ \t]+/gm, function (x) {
            return new Array(x.length + 1).join("&nbsp;");
          });
          if (tmp.indexOf("<img") >= 0) {
            tmp = tmp.replace(/<img/g, '<img style="max-width:300px;"');
            return tmp;
          }

          return tmp;
        } else {
          return message.messageContent.content;
        }
      };
    },
    own() {
      return (message) => {
        return message.from === wfc.getUserId() ? "own" : "";
      };
    },
  },
  methods: {
    goBack() {
      this.$parent.handlerChatRoom();
    },
  },
};
</script>

<style lang="less" scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  .barrage-header-wrap {
    height: 40px;
    text-align: center;
    position: relative;
    line-height: 40px;
    font-size: 14px;
    box-shadow: 1px 1px #e6e6e6;
    .back {
      font-size: 20px;
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
    }
  }
  .content-list {
    height: 100%;
    overflow-y: auto;
    .loading {
      text-align: center;
      height: 40px;
    }
    .message-list {
      padding-top: 10px;
      height: auto;
      position: relative;
      li {
        margin-bottom: 8px;
        .user-name {
          color: #bdbdbd;
          font-style: normal;
          font-weight: 400;
          font-size: 12px;
          line-height: 20px;
          letter-spacing: 0.02em;
        }
        .text {
          padding-left: 6px;
        }
      }
    }
  }
  &.large {
    .content-list {
      display: flex;
      flex-direction: column;
      background-color: #f5f5f5;
      box-shadow: 1px 1px #e6e6e6;
      flex: 1;
      padding: 0 12px;
      li {
        display: flex;
        flex-direction: column;
        .time {
          align-self: center;
          margin: 10px 0;
          color: #b4b4b4;
          height: 20px;
          font-size: 10px;
        }
        .message-wrap {
          display: flex;
        }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }
        .text-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-left: 10px;
          text-align: left;
          .text {
            padding: 10px 14px;
            position: relative;
            border-radius: 5px;
            background: #fff;
            min-height: 40px;
            text-align: left;
            &::before {
              left: -10px;
              top: 10px;
              position: absolute;
              border: solid transparent;
              content: "";
              height: 0;
              width: 0;
              pointer-events: none;
              border-right-color: #fff;
              border-width: 5px;
            }
          }
        }
        &.own {
          .message-wrap {
            flex-direction: row-reverse;
          }
          .avatar {
            margin-left: 10px;
          }
          .text-wrap {
            text-align: right;

            .text {
              background: #1dbb88;
              position: relative;
              color: #fff;
              &::before {
                right: -10px;
                left: inherit;
                pointer-events: none;
                border-right-color: transparent;
                border-left-color: #1dbb88;
              }
            }
          }
        }
      }
    }
  }
  &.small {
    overflow: hidden;
    .content-list {
      width: calc(100% + 30px);
      padding: 0 30px 0 20px;
      li {
        .text-wrap {
          max-width: 100%;
          overflow: hidden;
          background: rgba(61, 74, 93, 0.8);
          box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(4px);
          border-radius: 16px;
          padding: 4px 12px;
          box-sizing: border-box;
          display: inline-block;
          .user-name {
            color: #bdbdbd;
          }
          .text {
            color: #fff;
            display: inline;
          }
        }
        &.own {
          .text-wrap .user-name {
            color: #1dbb88;
          }
        }
      }
    }
  }
}
</style>
