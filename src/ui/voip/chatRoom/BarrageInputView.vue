<template>
  <section :class="['message-input-container', from]">
    <div
      @keydown.enter="send($event)"
      @paste="handlePaste"
      ref="input"
      class="input"
      draggable="false"
      :title="$t('conversation.input_send_placeholder')"
      autofocus
      onmouseover="this.setAttribute('org_title', this.title); this.title='';"
      onmouseout="this.title = this.getAttribute('org_title');"
      contenteditable="true"
    ></div>
    <div class="wra_con_send" v-if="!isOsx && from === 'large'">
      <button
        class="con_send"
        :title="$t('conversation.enter_send')"
        @click="send($event)"
      >
        {{ $t("common.send") }}
      </button>
    </div>
  </section>
</template>

<script>
import wfc from "@/wfc/client/wfc";
import TextMessageContent from "@/wfc/messages/textMessageContent";
import Draft from "@/ui/util/draft";
import ConversationInfo from "@/wfc/model/conversationInfo";
export default {
  name: "BarrageInputView",
  props: {
    currentConversationInfo: {
      type: ConversationInfo,
      required: true,
      default: null,
    },
    from: {
      type: String,
    },
  },
  data() {
    return {
      isOsx: process.platform === "darwin",
    };
  },
  methods: {
    async handlePaste(e) {
      let text;
      e.preventDefault();
      if ((e.originalEvent || e).clipboardData) {
        text = (e.originalEvent || e).clipboardData.getData("text/plain");
      } else {
        text = await navigator.clipboard.readText();
      }
      if (text && text.trim()) {
        this.insertText(text);
        return;
      }
    },
    insertText(text) {
      document.execCommand("insertText", false, text);
    },
    send(e) {
      this.$parent.checkJoinChatRoom();
      let input = this.$refs["input"];
      let message = input.innerHTML.trim();
      let currentConversation = this.currentConversationInfo.conversation;
      if (!currentConversation || !message) return;
      if (e.ctrlKey) {
        let nextChar = window
          .getSelection()
          .focusNode.textContent.charAt(window.getSelection().focusOffset);
        if (!nextChar) {
          document.execCommand("InsertHTML", true, "<br>");
        }
        if (window.getSelection) {
          let selection = window.getSelection(),
            range = selection.getRangeAt(0),
            br = document.createElement("br");
          range.deleteContents();
          range.insertNode(br);
          range.setStartAfter(br);
          range.setEndAfter(br);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        return;
      }
      message = message
        .replace(/<br>/g, "\n")
        .replace(/<div>/g, "\n")
        .replace(/<\/div>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "< ")
        .replace(/&gt;/g, "> ")
        .replace(/&amp;/g, "& ");

      // TODO 可以在此对文本消息进行处理，比如过滤掉 script，iframe 等标签
      message = message
        .replace(/<img class="emoji" draggable="false" alt="/g, "")
        .replace(
          /" src="https:\/\/chat-minio\.tongfudun\.com\/emoji\/72x72\/[0-9a-z-]+\.png">/g,
          ""
        );

      if (message && message.trim()) {
        let textMessageContent = new TextMessageContent(message);
        wfc.sendConversationMessage(currentConversation, textMessageContent);
        this.$refs["input"].innerHTML = "";
      }

      this.$refs["input"].innerHTML = "";
      Draft.setConversationDraft(currentConversation, "", null, null);
      // 发送消息时，会话消息列表需要滚动到最后
      this.$parent.scrollBottom();
      e.preventDefault();
    },
    insertHTML(html) {
      let sel, range;
      if (window.getSelection && (sel = window.getSelection())) {
        range = sel.getRangeAt(0);
        range.collapse(true);
        let imgEmoji = this.createElementFromHTML(html);
        range.insertNode(imgEmoji);
        range.setStartAfter(imgEmoji);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().text = html;
      }
    },
    createElementFromHTML(htmlString) {
      let div = document.createElement("div");
      div.innerHTML = htmlString.trim();
      return div.firstChild;
    },
    focusInput() {
      this.$nextTick(() => {
        this.$refs["input"].focus();
        console.log("focus end");
      });
    },
  },
  activated() {
    this.focusInput();
  },

  deactivated() {
    this.$refs["input"].innerHTML = "";
  },
};
</script>

<style lang="less" scoped>
.message-input-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1;
  &.small {
    height: 32px;
    background: rgba(61, 74, 93, 0.8);
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(4px);
    border-radius: 38px;
    overflow: hidden;
    .input {
      width: calc(100% + 20px);
      padding-right: 20px;
    }
  }
}

#emoji {
  position: absolute;
  bottom: 55px;
  left: 0;
  background: #fff;
}

.input-action-container {
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.input {
  flex: 1 1 auto;
  outline: none;
  padding: 0 20px;
  margin: 5px 0;
  overflow: auto;
  user-select: text;
  -webkit-user-select: text;
  font-size: 14px;
  color: #fff;
}
&.large .input {
  margin: 10px 0;
  color: #515a6e;
}
.input-action-container .action-bar {
  display: flex;
  align-items: center;
}
.input-action-container ul li {
  margin-left: 20px;
}

.input-action-container ul li:last-of-type {
  margin-right: 20px;
}

i {
  font-size: 24px;
  color: #000;
  cursor: pointer;
}
.con_send {
  width: 100px;
  padding: 5px 30px;
  border-radius: 4px;
  margin-left: 20px;
  margin-right: 20px;
  border: 1px solid #cccccc;
}
.wra_con_send {
  text-align: right;
  padding: 5px 5px;
  position: relative;
}

button.con_send:hover {
  width: 100px;
  background-color: #20bf64;
  margin-left: 20px;
  margin-right: 20px;
  color: white;
  border: none;
}
.input:empty:before {
  content: attr(title);
  color: #fff;
  font-size: 13px;
}
&.large .input:empty:before {
  color: #000;
}
</style>
