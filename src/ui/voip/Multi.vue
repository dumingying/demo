<!--export default class CallState {-->
<!--static STATUS_IDLE = 0;-->
<!--static STATUS_OUTGOING = 1;-->
<!--static STATUS_INCOMING = 2;-->
<!--static STATUS_CONNECTING = 3;-->
<!--static STATUS_CONNECTED = 4;-->
<!--}-->
<template>
  <div
    class="flex-column flex-align-center flex-justify-center multi-container"
    style="overflow: hidden"
  >
    <h1 style="display: none">Voip-Multi 运行在新的window，和主窗口数据是隔离的！！</h1>

    <div v-if="session" class="container">
      <section>
        <!--audio-->
        <div class="content-container">
          <!--self-->
          <div class="participant-container">
            <div
              v-if="audioOnly || !selfUserInfo._stream || selfUserInfo._isVideoMuted"
              class="avatar-wrap"
            >
              <img
                class="avatar"
                @error="mixinImgUrlAlt"
                draggable="false"
                :src="mixinDefaultPortrait(selfUserInfo.portrait)"
              />
              <video
                v-if="audioOnly && selfUserInfo._stream"
                class="hidden-video"
                :srcObject.prop="selfUserInfo._stream"
                muted
                playsInline
                autoPlay
              />
              <p class="single-line">{{ $t("voip.me") }}</p>
            </div>
            <video
              v-else
              class="video me"
              ref="localVideo"
              :srcObject.prop="selfUserInfo._stream"
              playsInline
              muted
              autoPlay
            />
          </div>
          <!--participants-->
          <div
            v-for="participant in participantUserInfos"
            :key="participant.uid"
            class="participant-container"
          >
            <div
              v-if="
                audioOnly ||
                status !== 4 ||
                !participant._stream ||
                participant._isVideoMuted
              "
              class="avatar-wrap"
            >
              <img
                class="avatar"
                @error="mixinImgUrlAlt"
                :src="participant.portrait"
                draggable="false"
                :alt="participant"
              />
              <video
                v-if="audioOnly && participant._stream"
                class="hidden-video"
                :srcObject.prop="participant._stream"
                playsInline
                autoPlay
              />
              <p class="single-line">{{ mixinGetUserName(participant) }}</p>
            </div>
            <div class="call-loading" v-if="!participant._stream">
              <span>{{ $t("voip.connecting") }}</span>
            </div>
            <video
              v-else
              class="video"
              :srcObject.prop="participant._stream"
              playsInline
              autoPlay
            />
          </div>
          <!--add more-->
          <!--通话建立成功之后，才允许邀请新参与者-->
          <div
            v-if="status === 4 && participantUserInfos.length < 8"
            class="participant-container add"
          >
            <img
              @click="invite"
              class="avatar"
              draggable="false"
              src="@/assets/images/add.png"
            />
          </div>
        </div>
      </section>
      <!--actions-->
      <footer>
        <!--incoming-->
        <div v-if="status === 2" class="action-container">
          <div class="action">
            <img
              @click="hangup"
              class="action-img"
              draggable="false"
              src="@/assets/images/av_hang_up.png"
            />
          </div>
          <div class="action">
            <img
              @click="answer"
              draggable="false"
              class="action-img"
              src="@/assets/images/av_video_answer.png"
            />
          </div>
          <!-- <div v-if="!audioOnly"
               class="action">
            <img @click="down2voice"
                 class="action-img"
                 src='@/assets/images/av_audio_answer.png' />
            <p>切换到语音聊天</p>
          </div> -->
        </div>
        <!--outgoing-->
        <div v-if="status === 1 || status === 3" class="action-container">
          <div class="action">
            <img
              @click="hangup"
              class="action-img"
              draggable="false"
              src="@/assets/images/av_hang_up.png"
            />
          </div>
        </div>

        <!--connected-->
        <div v-if="status === 4" class="duration-action-container">
          <p>{{ duration }}</p>
          <div class="action-container">
            <div class="action">
              <img
                @click="hangup"
                class="action-img"
                draggable="false"
                src="@/assets/images/av_hang_up.png"
              />
            </div>
            <div class="action">
              <img
                v-if="!session.audioMuted"
                @click="mute"
                class="action-img"
                draggable="false"
                src="@/assets/images/av_mute.png"
              />
              <img
                v-else
                @click="mute"
                class="action-img"
                draggable="false"
                src="@/assets/images/av_mute_hover.png"
              />
              <p>{{ $t("voip.mute") }}</p>
            </div>
            <div class="action" v-if="!audioOnly">
              <img
                v-if="!session.videoMuted"
                @click="muteVideo"
                class="action-img"
                draggable="false"
                src="@/assets/images/av_conference_video.png"
              />
              <img
                v-else
                @click="muteVideo"
                class="action-img"
                draggable="false"
                src="@/assets/images/av_conference_video_mute.png"
              />
              <p>
                {{
                  `${
                    session.videoMuted ? $t("voip.turn_video") : $t("voip.turn_off_video")
                  }`
                }}
              </p>
            </div>
            <!-- <div v-if="!audioOnly"
                 class="action">
              <img @click="screenShare"
                   class="action-img"
                   src='@/assets/images/av_share.png' />
            </div> -->
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import avenginekit from "../../wfc/av/internal/engine.min";
import CallSessionCallback from "../../wfc/av/engine/callSessionCallback";
import CallState from "@/wfc/av/engine/callState";
// import ScreenOrWindowPicker from './ScreenOrWindowPicker'
import wfc from "@/wfc/client/wfc";
import MultiCallOngoingMessageContent from "../../wfc/av/messages/multiCallOngoingMessageContent";
export default {
  name: "Multi",
  data() {
    return {
      session: null,
      audioOnly: false,
      status: 1,
      selfUserInfo: null,
      initiatorUserInfo: null,
      participantUserInfos: [],
      groupMemberUserInfos: [],

      startTimestamp: 0,
      currentTimestamp: 0,
      videoInputDeviceIndex: 0,
      //   broadcastMultiCallOngoingTimer: 0
      ringAudio: null,
    };
  },
  methods: {
    setupSessionCallback() {
      let sessionCallback = new CallSessionCallback();

      sessionCallback.didChangeState = (state) => {
        this.status = state;
        // 响铃示例代码
        if (state === CallState.STATUS_OUTGOING) {
          console.log("start outgoing ring");
          this.ringAudio = new Audio(require("@/assets/audios/outgoing_call_ring.mp3"));
          this.ringAudio.loop = true;
          this.ringAudio.play();
        } else if (state === CallState.STATUS_INCOMING) {
          // 由于浏览器的限制，web 端，可能不能自动播放！！!
          this.ringAudio = new Audio(require("@/assets/audios/incoming_call_ring.mp3"));
          this.ringAudio.loop = true;
          this.ringAudio.play();
        } else {
          if (this.ringAudio) {
            this.ringAudio.pause();
            this.ringAudio = null;
          }
        }

        if (state === CallState.STATUS_CONNECTED) {
          if (this.startTimestamp === 0) {
            this.startTimestamp = new Date().getTime();
            this.timer = setInterval(() => {
              this.currentTimestamp = new Date().getTime();
            }, 1000);
          }
        } else if (state === CallState.STATUS_IDLE) {
          if (this.timer) {
            clearInterval(this.timer);
          }
        }
      };

      sessionCallback.onInitial = (
        session,
        selfUserInfo,
        initiatorUserInfo,
        participantUserInfos,
        groupMemberUserInfos
      ) => {
        this.session = session;

        this.audioOnly = session.audioOnly;
        this.selfUserInfo = selfUserInfo;
        this.initiatorUserInfo = initiatorUserInfo;
        // 为了逻辑更清晰，参数引用传递，参数中传入的participantUserInfos会变化，如果直接使用的话，didParticipantJoined里面，可啥都不做
        this.participantUserInfos = [...participantUserInfos];
        this.groupMemberUserInfos = groupMemberUserInfos;

        // pls refer to: https://vuejs.org/v2/guide/reactivity.html
        this.$set(this.selfUserInfo, "_stream", null);
        this.participantUserInfos.forEach((p) => this.$set(p, "_stream", null));
        this.groupMemberUserInfos.forEach((m) => this.$set(m, "_stream", null));

        // if (selfUserInfo.uid === initiatorUserInfo.uid) {
        //   this.broadcastMultiCallOngoingTimer = setInterval(
        //     this.broadcastMultiCallOngoing,
        //     1000
        //   )
        // }
      };

      sessionCallback.didChangeMode = (audioOnly) => {
        this.audioOnly = audioOnly;
      };

      sessionCallback.didCreateLocalVideoTrack = (stream) => {
        this.selfUserInfo._stream = stream;
      };

      sessionCallback.didReceiveRemoteVideoTrack = (userId, stream) => {
        let p;
        for (let i = 0; i < this.participantUserInfos.length; i++) {
          p = this.participantUserInfos[i];
          if (p.uid === userId) {
            p._stream = stream;
            break;
          }
        }
      };

      sessionCallback.didParticipantJoined = (userId, screenSharing) => {
        let userInfo = wfc.getUserInfo(userId);
        userInfo._stream = null;
        this.participantUserInfos.push(userInfo);
        // 去重
        let obj = {};
        this.participantUserInfos = this.participantUserInfos.reduce((current, next) => {
          obj[next.uid] ? "" : (obj[next.uid] = true && current.push(next));
          return current;
        }, []);
      };

      sessionCallback.didParticipantLeft = (userId) => {
        this.participantUserInfos = this.participantUserInfos.filter(
          (p) => p.uid !== userId
        );
        console.log("didParticipantLeft d", userId, this.participantUserInfos.length);
      };

      sessionCallback.didCallEndWithReason = (reason) => {
        console.log("callEndWithReason", reason);
        this.session.closeVoipWindow();
        this.session = null;
      };

      sessionCallback.didVideoMuted = (userId, muted) => {
        this.participantUserInfos.forEach((u) => {
          if (u.uid === userId) {
            let client = this.session.getSubscriber(userId);
            u._isVideoMuted = client.videoMuted;
            console.log("didMuteStateChanged", client.videoMuted, client.audioMuted);
          }
        });
      };

      sessionCallback.didMediaLostPacket = (media, lostPacket) => {
        if (lostPacket > 6) {
          //   console.log("您的网络不好");
          this.$Toast.show({
            type: "",
            text: this.$t("voip.network_unstable"),
            time: 5000,
          });
        }
      };

      sessionCallback.didUserMediaLostPacket = (userId, media, lostPacket, uplink) => {
        //如果uplink true 对方网络不好，false您的网络不好
        //接收方丢包超过10为网络不好
        if (lostPacket > 10) {
          if (uplink) {
            let userInfos = this.participantUserInfos.filter((u) => u.uid === userId);
            if (userInfos && userInfos.length > 0) {
              //   console.log(userInfos[0].displayName, "网络不好");
              this.$Toast.show({
                type: "",
                text: `${this.mixinGetUserName(userInfos[0])} ${this.$t(
                  "voip.unstable"
                )}`,
                time: 5000,
              });
            }
          } else {
            // console.log("您的网络不好");
            this.$Toast.show({
              type: "",
              text: this.$t("voip.network_unstable"),
              time: 5000,
            });
          }
        }
      };
      sessionCallback.didChangeInitiator = (initiator) => {
        this.initiatorUserInfo = wfc.getUserInfo(initiator);
        // if (!this.broadcastMultiCallOngoingTimer) {
        //   this.broadcastMultiCallOngoingTimer = setInterval(
        //     this.broadcastMultiCallOngoing,
        //     200
        //   );
        // }
      };

      avenginekit.sessionCallback = sessionCallback;
    },

    answer() {
      this.session.call();
    },

    hangup() {
      this.session.hangup();
    },
    // switchCamera() {
    //   if (!this.session || this.session.isScreenSharing()) {
    //     return
    //   }
    //   // The order is significant - the default capture devices will be listed first.
    //   // navigator.mediaDevices.enumerateDevices()
    //   navigator.mediaDevices.enumerateDevices().then((devices) => {
    //     devices = devices.filter((d) => d.kind === 'videoinput')
    //     if (devices.length < 2) {
    //       console.log('switchCamera error, no more video input device')
    //       return
    //     }
    //     this.videoInputDeviceIndex++
    //     if (this.videoInputDeviceIndex >= devices.length) {
    //       this.videoInputDeviceIndex = 0
    //     }
    //     this.session.setVideoInputDeviceId(
    //       devices[this.videoInputDeviceIndex].deviceId
    //     )
    //     console.log(
    //       'setVideoInputDeviceId',
    //       devices[this.videoInputDeviceIndex]
    //     )
    //   })
    // },

    mute() {
      let toMute = this.session.audioMuted ? false : true;
      this.selfUserInfo._isAudioMuted = toMute;
      this.session.muteAudio(toMute);
    },

    muteVideo() {
      let toMute = this.session.videoMuted ? false : true;
      this.selfUserInfo._isVideoMuted = toMute;
      this.session.muteVideo(toMute);
    },

    down2voice() {
      this.session.downgrade2Voice();
    },

    invite() {
      let successCB = (users) => {
        if (!users.length) return;
        let userIds = users.map((u) => u.uid);
        this.session.inviteNewParticipants(userIds);
      };
      this.$pickContact({
        users: this.session.groupMemberUserInfos,
        initialCheckedUsers: [
          ...this.session.participantUserInfos,
          this.session.selfUserInfo,
        ],
        uncheckableUsers: [
          ...this.session.participantUserInfos,
          this.session.selfUserInfo,
        ],
        showCategoryLabel: false,
        confirmTitle: this.$t("common.confirm"),
        successCB,
      });
    },
    broadcastMultiCallOngoing() {
      let participants = this.participantUserInfos
        .map((pu) => pu.uid)
        .filter((uid) => uid !== this.selfUserInfo.uid);
      let ongoing = new MultiCallOngoingMessageContent(
        this.session.callId,
        this.session.initiatorId,
        this.session.audioOnly,
        participants
      );
      wfc.sendConversationMessage(this.session.conversation, ongoing);
    },
  },
  computed: {
    duration() {
      if (this.currentTimestamp <= 0) {
        return "00:00";
      }
      let escapeMillis = this.currentTimestamp - this.startTimestamp;
      return this.mixinTimestampFormat(escapeMillis);
    },
    // 媒体设备信息
    externalDevice() {
      return this.$store.state.deviceObj;
    },
  },
  watch: {
    watch: {
      "externalDevice.hasAudio"(n, o) {
        if (!n) {
          this.session.closeVoipWindow();
          this.session = null;
        }
      },
      "externalDevice.hasVideo"(n, o) {
        if (!n) {
          this.session.closeVoipWindow();
          this.session = null;
        }
      },
    },
  },
  mounted() {
    document.title = this.$t("login.chainpal");
    avenginekit.setup();
    this.setupSessionCallback();
  },
  unmounted() {
    // reset
    this.$set(this.selfUserInfo, "_stream", null);
    this.groupMemberUserInfos.forEach((m) => this.$set(m, "_stream", null));
    // if (this.broadcastMultiCallOngoingTimer) {
    //   clearInterval(this.broadcastMultiCallOngoingTimer)
    // }
  },
};
</script>

<style lang="less" scoped>
.container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  section {
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .content-container {
    width: 100%;
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    .participant-container {
      width: 200px;
      height: 200px;
      margin: 10px 5px 0;
      border-radius: 5px;
      overflow: hidden;
      position: relative;
      &.add {
        border: 2px dashed #eee;
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
      }
      .call-loading {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        span {
          font-weight: bold;
          color: #000;
          font-size: 14px;
        }
      }
      .single-line {
        position: absolute;
        bottom: 5px;
        left: 5px;
        height: 24px;
        line-height: 20px;
        text-align: center;
        color: #000;
        background: #fff;
        border-radius: 32px;
        padding: 0 10px;
      }
      .avatar-wrap {
        width: 200px;
        height: 200px;
        position: relative;
        .avatar {
          width: 200px;
          height: 200px;
          position: absolute;
          left: 0;
          top: 0;
        }
      }
      & > video {
        max-width: 100%;
        max-height: 100%;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      p {
        max-height: 20px;
        color: white;
      }
    }
  }
}
.hidden-video {
  height: 0;
}
footer {
  height: 160px;
}

.duration-action-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  p {
    color: #fff;
    padding: 10px 0;
  }
}

.action-container {
  width: 100%;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: space-around;
  padding-bottom: 20px;
  .action {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 12px;
    color: #fff;
    p {
      margin-top: 5px;
    }
  }
}

.action-img {
  width: 60px;
  height: 60px;
}

.video.me {
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);
}
</style>
