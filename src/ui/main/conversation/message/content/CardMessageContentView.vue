<template>
  <div :id="'userCardInfoTrigger' + message.messageId"
       class="user-card-content-container"
       @click="goCard">
    <div class="portrait-name-container">
      <img :src="mixinDefaultPortrait(message.messageContent.portrait)"
           alt="portrait"
           :default-img="defaultImg"
           draggable="false" />
      <p class="single-line">{{ cardName }}</p>
    </div>
    <p class="desc single-line">{{ cardTypeName }}</p>
  </div>
</template>

<script>
import Message from '@/wfc/messages/message'
import Conversation from '@/wfc/model/conversation'
import ConversationType from '@/wfc/model/conversationType'
import wfc from '@/wfc/client/wfc'
import store from '@/store'
import Config from '@/config'
import ChannelInfo from '@/wfc/model/channelInfo'
import { tipsContent } from '../../../../common/Tips'
export default {
  name: 'ChannelCardMessageContentView',
  props: {
    message: {
      required: true,
      type: Message
    }
  },
  data() {
    return {
      defaultImg: Config.DEFAULT_PORTRAIT_URL
    }
  },
  computed: {
    cardTypeName() {
      let str = {
        1013: this.$t('contact.contact'),
        1029: this.$t('contact.channel')
      }
      return str[this.message.messageContent.type]
    },
    cardName() {
      let str = {
        1013: this.message.messageContent.userName,
        1029: this.message.messageContent.channelName
      }
      return str[this.message.messageContent.type]
    },
    permissionList() {
      return this.$store.state.permissionList
    }
  },
  methods: {
    userInfo() {
      let messageContent = this.message.messageContent
      if (messageContent.type === 1013) {
        return wfc.getUserInfo(messageContent.target, true)
      }
    },
    goCard() {
      let messageContent = this.message.messageContent
      //   console.log(messageContent.type, "点击名片", messageContent.portrait);
      if (messageContent.type === 1013) {
        if (
          messageContent.userId !== wfc.getUserId() &&
          !wfc.isMyFriend(messageContent.userId) &&
          wfc.getMyFriendList(true).length >= this.permissionList.friendsLimit
        ) {
          this.$alert({
            content: tipsContent[16],
            height: 150,
            cancelText: ''
          })
        } else {
          let conversation = new Conversation(
            ConversationType.Single,
            messageContent.userId,
            0
          )
          store.setCurrentConversation(conversation)
        }
      } else {
        let channel = wfc.getChannelInfo(messageContent.channelId, true)
        if (channel instanceof ChannelInfo) {
          store.setCurrentChannel(channel)
        } else {
          let timer = setTimeout(() => {
            store.setCurrentChannel(
              wfc.getChannelInfo(messageContent.channelId, false)
            )
            timer && clearTimeout(timer)
          }, 200)
        }
        if (this.$router.currentRoute.value.path !== '/home/contact') {
          this.$router.replace('/home/contact')
        }
      }
    }
  }
}
</script>

<style scoped lang="css">
.user-card-content-container {
  width: 250px;
  height: 100px;
  margin: 0 10px;
  padding: 10px;
  background-color: white;
  position: relative;
  border-radius: 5px;
}

.portrait-name-container {
  display: flex;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #eeeeee;
}

.portrait-name-container img {
  width: 45px;
  height: 45px;
  border-radius: 3px;
}

.portrait-name-container p {
  padding-left: 10px;
  padding-right: 10px;
}

.desc {
  padding-top: 8px;
  font-size: 13px;
  color: #b8b8b8;
}
</style>
