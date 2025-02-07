<template>
  <h2 class="cloud-title">
    <h4>{{ $t("common.cloud_disk") }}</h4>
    <div class="cloud-info">
      <span :class="['text', setUseLine > 100 ? 'red-icon' : '']">
        {{ space.use }}/<em>{{ space.total }}</em>
      </span>
      <div class="range">
        <span
          :class="['used-line', setUseLine > 100 ? 'red-line' : '']"
          :style="{ width: `${setUseLine}%` }"
        >
        </span>
      </div>
    </div>
  </h2>
</template>

<script>
export default {
  components: {},
  props: {
    space: {
      type: Object,
    },
  },
  data() {
    return {};
  },
  computed: {
    setUseLine() {
      let { totalSpace, usedSpace } = this.space;
      if (totalSpace) {
        let num = (usedSpace / totalSpace) * 100;
        return num > 100 ? 101 : num;
      }
      return 0;
    },
  },
  watch: {},
  created() {},
  mounted() {},
  methods: {},
};
</script>
<style lang="less" scoped>
//@import url(); 引入公共css类
.cloud-title {
  font-weight: 500;
  font-size: 18px;
  color: #000;
  display: flex;
  h4 {
    font-family: "PingFang SC";
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 20px;
    letter-spacing: -0.23px;
    color: #000000;
  }
  .cloud-info {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-family: "PingFang SC";
    font-size: 12px;
    margin-left: 12px;
    height: 20px;
    .text {
      color: #1dbb88;
      font-size: 12px;
      line-height: 10px;
      &.yellow-icon {
        color: #ffee56;
      }
      &.red-icon {
        color: #ff0101;
      }
      em {
        font-size: 11px;
        vertical-align: top;
        opacity: 0.8;
        font-style: normal;
        color: #1dbb88;
      }
    }
    .total {
      color: #666;
      font-weight: bold;
    }
    .use-text {
      color: #999;
    }
    .range {
      position: relative;
      width: 160px;
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      background: #daf6ed;
      .used-line {
        border-radius: 3px;
        overflow: hidden;
        height: 6px;
        position: absolute;
        z-index: 1;
        top: 0;
        left: 0;
        background: linear-gradient(
            270deg,
            rgba(0, 0, 0, 0.12) 0%,
            rgba(0, 0, 0, 0) 47.91%
          ),
          #1dbb88;
        &.red-line {
          background: linear-gradient(270deg, #ff0000 0%, #ff6a6a 100%);
        }
      }
    }
  }
}
</style>
