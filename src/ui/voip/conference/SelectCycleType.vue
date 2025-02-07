<template>
  <div class="select-cycle-type">
    <h4 class="header">{{ title }}</h4>
    <ul class="content">
      <li
        v-for="item in frequencyList"
        @click="selectFrequency(item)"
        :class="frequency === item.value ? 'active' : ''"
        :key="item.value"
      >
        {{ item.key }}
      </li>
    </ul>
    <div class="btn-wrap">
      <span class="btn cancel" @click="handleCancel">{{ $t("common.cancel") }}</span>
      <span class="btn join" @click="handleConfirm">{{ $t("common.confirm") }}</span>
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  props: {
    title: {
      type: String,
    },
    meetingDetail: {
      type: Object,
    },
  },
  data() {
    return {
      frequency: 1,
      frequencyList: [
        { key: this.$t("voip.daily"), value: 1 },
        { key: this.$t("voip.weekly"), value: 3 },
        { key: this.$t("voip.monthly"), value: 4 },
        { key: this.$t("voip.weekday"), value: 2 },
      ],
    };
  },
  created() {
    this.frequency = this.meetingDetail.cycleType || 1;
  },
  methods: {
    selectFrequency(item) {
      this.frequency = item.value;
    },
    handleCancel() {
      this.$modal.hide("SelectCycleType-modal", { type: "cancel" });
    },
    handleConfirm() {
      this.$modal.hide("SelectCycleType-modal", {
        type: "confirm",
        cycleType: this.frequency,
      });
    },
  },
};
</script>
<style lang="less" scoped>
.select-cycle-type {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .header {
    height: 52px;
    text-align: center;
    line-height: 52px;
    box-shadow: 0px 1px 6px rgba(0, 0, 0, 0.04);
    font-family: PingFang SC;
    font-size: 18px;
    color: #333;
    font-weight: 600;
  }
  .content {
    flex: 1;
    li {
      height: 44px;
      line-height: 44px;
      border-bottom: 1px solid #f7f7f7;
      color: #666;
      text-align: center;
      font-family: PingFang SC;
      font-size: 14px;
      font-weight: 500;
      &:last-child {
        border-bottom: none;
      }
      &::after {
        vertical-align: middle;
        display: inline-block;
        width: 20px;
        height: 20px;
        content: "";
      }
      &.active {
        &::after {
          background: url("../../../assets/images/svg/dui.svg") no-repeat center;
          background-size: 20px auto;
        }
      }
    }
  }

  .btn-wrap {
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
