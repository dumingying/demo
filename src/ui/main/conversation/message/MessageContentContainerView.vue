<template>
  <TextMessageContentView :message="message"
                          v-if="message.messageContent.type === 1 ||isChatMode(message) "
                          :style="{'--out-arrow-color':'#1dbb88', '--in-arrow-color':'white'}"
                          v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}" />
  <AudioMessageContentView :message="message"
                           v-else-if="message.messageContent.type === 2" />
  <ImageMessageContentView :message="message"
                           v-else-if="message.messageContent.type === 3" />
  <!--  v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>-->
  <FileMessageContentView :message="message"
                          v-else-if="message.messageContent.type === 5"
                          v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}" />
  <VideoMessageContentView :message="message"
                           v-else-if="message.messageContent.type === 6" />
  <!-- v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>-->
  <StickerMessageContentView :message="message"
                             v-else-if="message.messageContent.type === 7" />
  <CompositeMessageContentView :message="message"
                               v-else-if="message.messageContent.type === 11" />
  <CallStartMessageContentView :message="message"
                               v-else-if="message.messageContent.type === 400" />
  <ConferenceInviteMessageContentView :message="message"
                                      v-else-if="message.messageContent.type === 408" />
  <!--======================= 自定义消息展示=============== -->
  <CloudDiskMessageContentView :message="message"
                               v-else-if="message.messageContent.type === 1007" />
  <TeamMessageNotificationContentView :message="message"
                                      v-else-if="message.messageContent.type === 1010" />
  <UrlMessageContentView :message="message"
                         v-else-if="message.messageContent.type === 1012" />
  <MembershipCouponView :message="message"
                        v-else-if="[1022,1028].includes(message.messageContent.type)" />
  <UserCardMessageContentView :message="message"
                              v-else-if="message.messageContent.type === 10"
                              :style="{'--out-arrow-color':'white', '--in-arrow-color':'white'}"
                              v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}" />
  <CardMessageContentView :message="message"
                          v-else-if="[1013,1029].includes(message.messageContent.type)"
                          :style="{'--out-arrow-color':'white', '--in-arrow-color':'white'}"
                          v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}" />
  <ConferenceRequestStatusMessageContentView :message="message"
                                             v-else-if="[1031].includes(message.messageContent.type)" />
  <MeetingReportContentView :message="message"
                            v-else-if="[1032].includes(message.messageContent.type)" />
  <DtcMessageContentView :message="message"
                            v-else-if="[1040].includes(message.messageContent.type)" />
  <UnsupportMessageContentView :message="message"
                               v-else-if="[/* todo un support message types */].indexOf(message.messageContent.type) >= 0" />
  <UnknownMessageContentView :message="message"
                             v-else
                             v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}" />

</template>

<script>
import Message from '@/wfc/messages/message'
import TextMessageContentView from '@/ui/main/conversation/message/content/TextMessageContentView'
import ImageMessageContentView from '@/ui/main/conversation/message/content/ImageMessageContentView'
import VideoMessageContentView from '@/ui/main/conversation/message/content/VideoMessageContentView'
import UnsupportMessageContentView from '@/ui/main/conversation/message/content/UnsupportMessageContentView'
import FileMessageContentView from '@/ui/main/conversation/message/content/FileMessageContentView'
import StickerMessageContentView from '@/ui/main/conversation/message/content/StickerMessageContentView'
import CallStartMessageContentView from '@/ui/main/conversation/message/content/CallStartMessageContentView'
// 语音消息说明
//  目前提供连个实现版：
//  1. 基于APP_SERVER做编码转换，采用audio标签，播放mp3文件，对应AudioMessageContentViewAPP
//  2. 本地解码，采用自定义UI，直接播放AMR文件，对应AudioMessageContentViewAMR
import AudioMessageContentView from '@/ui/main/conversation/message/content/AudioMessageContentViewAMR'
// import AudioMessageContentView from "@/ui/main/conversation/message/content/AudioMessageContentViewAPP";
import CompositeMessageContentView from '@/ui/main/conversation/message/content/CompositeMessageContentView'
import UserCardMessageContentView from './content/UserCardMessageContentView'
import CardMessageContentView from './content/CardMessageContentView'
import ConferenceRequestStatusMessageContentView from './content/ConferenceRequestStatusMessageContentView'
import ConferenceInviteMessageContentView from './content/ConferenceInviteMessageContentView'
import UnknownMessageContentView from './content/UnknownMessageContentView'
import CloudDiskMessageContentView from './content/CloudDiskMessageContentView'
import UrlMessageContentView from './content/UrlMessageContentView'
import TeamMessageNotificationContentView from './content/TeamMessageNotificationContentView'
import MembershipCouponView from './content/MembershipCouponView'
import MeetingReportContentView from './content/MeetingReportContentView'
import DtcMessageContentView from './content/DtcMessageContentView'

export default {
  name: 'MessageContentContainerView',
  props: {
    message: {
      type: Message,
      required: true
    }
  },
  components: {
    UnknownMessageContentView,
    ConferenceInviteMessageContentView,
    CompositeMessageContentView,
    AudioMessageContentView,
    CallStartMessageContentView,
    UnsupportMessageContentView,
    TextMessageContentView,
    ImageMessageContentView,
    VideoMessageContentView,
    FileMessageContentView,
    StickerMessageContentView,
    UserCardMessageContentView,
    CardMessageContentView,
    UrlMessageContentView,
    CloudDiskMessageContentView,
    TeamMessageNotificationContentView,
    ConferenceRequestStatusMessageContentView,
    MembershipCouponView,
    MeetingReportContentView,
    DtcMessageContentView
  },

  computed: {
    // 是否是阅后即焚消息
    isChatMode() {
      return (msg) => {
        try {
          let extra = msg.messageContent.extra
          if (extra && typeof extra === 'string') {
            let extraObj = JSON.parse(extra)
            return Number(extraObj.chatMode) === 1
          }
          return false
        } catch (error) {
          return false
        }
      }
    }
  }
}
</script>

<style lang="css">
:root {
  --in-arrow-color: white;
  --out-arrow-color: #1dbb88;
}

.leftarrow:before {
  /*right: -10px;*/
  left: -10px;
  top: 15px;
  position: absolute;
  border: solid transparent;
  content: '';
  height: 0;
  width: 0;
  pointer-events: none;
}

.leftarrow:before {
  border-color: transparent;
  border-right-color: var(--in-arrow-color);
  border-width: 5px;
}

.rightarrow:before {
  /*right: -10px;*/
  left: 100%;
  top: 15px;
  position: absolute;
  border: solid transparent;
  content: '';
  height: 0;
  width: 0;
  pointer-events: none;
}

.rightarrow:before {
  border-color: transparent;
  border-left-color: var(--out-arrow-color);
  border-width: 5px;
}
</style>
