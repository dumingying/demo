<template>
  <div class="chat-room-wrap">
    <template v-if="currentConversationInfo">
      <div class="barrage-wrap">
        <BarrageMessageContentView
          from="large"
          name="page"
          ref="largeBarrageMessage"
          :currentConversationInfo="currentConversationInfo"
          :currentChatRoomMessageList="currentChatRoomMessageList"
        ></BarrageMessageContentView>
      </div>
      <div class="input-wrap">
        <BarrageInputView
          from="large"
          :currentConversationInfo="currentConversationInfo"
        ></BarrageInputView>
      </div>
    </template>
  </div>
</template>

<script>
import BarrageMessageContentView from "./BarrageMessageContentView";
import BarrageInputView from "./BarrageInputView";
import ConversationType from "@/wfc/model/conversationType";
import Conversation from "@/wfc/model/conversation";

import wfc from "@/wfc/client/wfc";
import store from "@/store";

import { ipcRenderer } from "@/platform";

export default {
  components: {
    BarrageMessageContentView,
    BarrageInputView,
  },
  data() {
    return {
      sharedConversationState: store.state.conversation,
      currentChatRoomMessageList: [],
      currentConversationInfo: null,
      joinChatCount: 0,
      chatRoomId: "",
      initChatRoomList: [],
      init: false,
    };
  },
  watch: {
    "sharedConversationState.currentConversationMessageList": {
      handler: function (n, o) {
        this.getCurrentChatRoomMessageList(n);
      },
      deep: true,
      immediate: true,
    },
  },
  mounted() {
    ipcRenderer.on("chat-room-loaded", (event, args) => {
      let data = JSON.parse(args);
      this.chatRoomId = data.code;
      this.init = true;
      this.initChatRoomList = data.messageList;
      let conversation = new Conversation(ConversationType.ChatRoom, this.chatRoomId, 0);
      this.currentConversationInfo = wfc.getConversationInfo(conversation);
      store.setCurrentConversation(conversation);
      this.getCurrentChatRoomMessageList();
    });
  },
  methods: {
    getCurrentChatRoomMessageList(list) {
      if (!list) {
        this.currentChatRoomMessageList = this.initChatRoomList;
      } else {
        this.currentChatRoomMessageList = [...this.initChatRoomList, ...list];
      }

      this.scrollBottom();
    },
    //检测是否加入成功
    checkJoinChatRoom() {
      if (!this.currentConversationInfo) {
        this.joinChatCount = 0;
        this.joinChatroom(this.chatRoomId);
      }
    },
    //加入聊天室1
    joinChatroom(chatRoomId) {
      this.joinChatCount++;
      wfc.joinChatroom(
        chatRoomId,
        () => {
          console.log("加入会议成功了！！", chatRoomId);
          this.joinChatCount = 0;
          let conversation = new Conversation(ConversationType.ChatRoom, chatRoomId, 0);
          this.currentConversationInfo = wfc.getConversationInfo(conversation);
          store.setCurrentConversation(conversation);
        },
        (error) => {
          this.currentConversationInfo = null;
          console.log(error, "进入聊天室失败了", this.joinChatCount);
          if (this.joinChatCount === 1) {
            this.joinChatroom(chatRoomId);
            console.log(error, "再重新进入了一次聊天室", this.joinChatCount);
          }
        }
      );
    },
    // 处理聊天室滚动样式
    scrollBottom() {
      const timer = setTimeout(() => {
        let largeDom = this.$refs["largeBarrageMessage"];
        largeDom && scrollTopFn(largeDom);
        let smallDom = this.$refs["smallBarrageMessage"];
        smallDom && scrollTopFn(smallDom);
        function scrollTopFn(dom) {
          let messageListElement = dom.$refs["messageWrap"];
          messageListElement &&
            messageListElement.scroll({
              top: messageListElement.scrollHeight,
              left: 0,
              behavior: "auto",
            });
        }
        timer && clearTimeout(timer);
      }, 200);
    },
  },
};
</script>
<style lang="less" scoped>
.chat-room-wrap {
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(6px);
  border-left: 1px solid #e6e6e6;
  z-index: 999;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .barrage-wrap {
    width: 100%;
    height: calc(100% - 160px);
    background: #fff;
  }

  .input-wrap {
    width: 100%;
    height: 160px;
    background: #fff;
  }
}
</style>
