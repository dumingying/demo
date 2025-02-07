<template>
  <div>
    <div class="membership-coupon-message-container" @click="handlerCoupon">
      <div class="flex-row flex-align-center membership-coupon-message-wrap">
        <div class="content">
          <p class="title single-line">{{ fromName }}{{ titleOrDesc(0) }}</p>
          <p class="desc">{{ titleOrDesc(1) }}</p>
        </div>
        <img :src="imgUrl" draggable="false" width="40px" />
      </div>
      <p class="type">{{ $t("login.chainpal") }}</p>
    </div>
  </div>
</template>

<script>
import Message from "@/wfc/messages/message";
export default {
  name: "MembershipCouponView",
  props: {
    message: {
      type: Message,
      required: true,
    },
  },
  computed: {
    fromName() {
      let name = this.message.messageContent.fromName;
      if (/^1[3|4|5|7|8|9][0-9]{9}$/.test(name)) {
        name = this.mixinResetPhoneNumber(name);
      }
      return name;
    },
    imgUrl() {
      return require("@/assets/images/coupon.png");
    },
    titleOrDesc() {
      return (type) => {
        let textObj = "";
        if (!type) {
          textObj = {
            1022: this.$t("message.give_away"),
            1028: this.$t("message.invite_open"),
          };
        } else {
          textObj = {
            1022: this.$t("message.come_on_receive"),
            1028: this.$t("message.open_permissions"),
          };
        }
        return textObj[this.message.messageContent.type];
      };
    },
  },
  created() {},
  mounted() {},
  methods: {
    handlerCoupon() {
      let textObj = {
        1022: this.$t("message.iphone_receive"),
        1028: this.$t("message.iphone_open"),
      };
      this.$alert({
        content: `<p style="text-align:center">${
          textObj[this.message.messageContent.type]
        }</p>`,
        cancelText: "",
        height: 128,
        confirmText: this.$t("voip.i_known"),
        confirmCallback: () => {},
      });
    },
  },
};
</script>

<style lang="less" scoped>
.membership-coupon-message-container {
  margin: 0 10px;
  /* padding: 5px; */
  background-color: white;
  width: 250px;
  max-width: 250px;
  position: relative;
  border-radius: 5px;
}
.membership-coupon-message-wrap {
  padding: 10px;
  background: #1dbb88;
  border-radius: 5px 5px 0px 0px;
}

.type {
  padding: 5px 10px;
  font-size: 11px;
}
.content {
  width: 100%;
  overflow: hidden;
  .title {
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    word-break: break-word;
  }

  .desc {
    font-size: 12px;
    color: #fff;
  }
}
</style>
