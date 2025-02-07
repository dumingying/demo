<template>
  <div class="request-meeting">
    <h4 class="header">
      <span>{{ title }}</span>
      <Icon type="md-close" class="close" @click="handleCancel" />
    </h4>
    <div class="content">
      <p class="name">
        <label>{{ $t("voip.meeting_subject") }}：</label>
        <span class="new-single-line"> {{ meetingInfo.title }}</span>
      </p>
      <p class="code">
        <label>{{ $t("voip.meeting_id") }}：</label>
        <span>{{ meetingInfo.code }}</span>
      </p>
    </div>
    <div class="btn-wrap">
      <span class="btn cancel" @click="handleCancel">{{ $t("voip.cancel") }}</span>
      <span class="btn join" @click="handleJoin">{{ $t("voip.meeting_send") }}</span>
    </div>
  </div>
</template>

<script>
import { requestJoin } from "@/axios";
import wfc from "@/wfc/client/wfc";
export default {
  name: "RequestMeeting",
  props: {
    title: {
      type: String,
      default: "",
    },
    meetingInfo: {
      type: Object,
      default: {},
    },
  },
  components: {},
  data() {
    return {
      lock: false,
    };
  },
  methods: {
    handleCancel() {
      this.$modal.hide("RequestMeeting-modal");
    },
    async handleJoin() {
      if (this.lock) return;
      this.lock = true;
      console.log(this.meetingInfo);
      try {
        let res = await requestJoin({
          code: this.meetingInfo.code,
          userId: wfc.getUserId(),
        });
        this.lock = false;
        let { code, message, data } = res.data;
        if (code === "000000") {
          console.log(data);
          //   let status = Number(data.status)
          //   console.log(status)
          //   if (!status) {
          //     this.$Message.success('正在申请中...')
          //   } else if (status === 2) {
          //     this.$Message.success(message)
          //   }
          this.$modal.hide("RequestMeeting-modal", { params: true });
        } else {
          this.$Message.warning(message);
        }
      } catch (error) {
        this.lock = false;
        console.log(error);
      }
    },
  },
};
</script>
<style lang="less" scoped>
.request-meeting {
  background: url(../../../assets/images/request-meeting-bg.png) no-repeat 0 0,
    linear-gradient(180deg, #fffaed 0%, #ffffff 78.4%);
  border-radius: 12px;
  width: 100%;
  height: 100%;
  background-size: 80px;
  overflow: hidden;
  .header {
    padding: 20px 20px 0 20px;
    box-sizing: border-box;
    line-height: 40px;
    text-align: center;
    position: relative;
    span {
      font-style: normal;
      font-weight: 400;
      font-size: 18px;
      line-height: 26px;
      text-align: center;
      color: #253456;
    }
    .close {
      position: absolute;
      z-index: 1;
      right: 20px;
      top: 20px;
      font-size: 24px;
    }
  }
  .content {
    margin: 28px 20px 0;
    padding: 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0px 1px 8px 0px rgba(0, 0, 0, 0.12);
    p {
      font-style: normal;
      font-weight: 400;
      font-size: 16px;
      line-height: 22px;
      color: #666666;
      opacity: 0.8;
      margin-top: 8px;
      display: flex;
      label {
        min-width: 82px;
      }
      span {
        flex: 1;
        font-weight: 400;
        font-size: 16px;
        line-height: 22px;
        text-align: right;
        color: #000000;
        opacity: 0.8;
      }
    }
  }
  .btn-wrap {
    margin-top: 24px;
    height: 54px;
    display: flex;
    flex-direction: row;
    position: relative;
    &::after {
      position: absolute;
      left: 0;
      top: 0;
      content: "";
      width: 100%;
      height: 1px;
      background: #e6e6e6;
    }
    .btn {
      flex: 1;
      margin: 10px 0;
      font-size: 16px;
      line-height: 30px;
      text-align: center;
      color: #333333;
    }
    .cancel {
      border-right: 1px solid #f2f2f2;
    }
    .join {
      color: #1dbb88;
    }
  }
}
</style>
