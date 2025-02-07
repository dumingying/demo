<template>
  <div class="spin-loading-wrap">
    <div v-for="i in 11" :class="['sk-child', `sk-circle${i}`]" :key="i"></div>
  </div>
</template>

<script>
export default {
  components: {},
  data() {
    return {};
  },
  watch: {},
  created() {},
  mounted() {},
  methods: {},
};
</script>
<style lang="less" scoped>
/** 加载动画的静态样式 **/
/** 加载动画 **/
@keyframes loading {
  50% {
    opacity: 0.3;
    -webkit-transform: scale(0.4);
    transform: scale(0.4);
  }
  100% {
    opacity: 1;
    -webkit-transform: scale(1);
    transform: scale(1);
  }
}
@-webkit-keyframes loading {
  50% {
    opacity: 0.3;
    -webkit-transform: scale(0.4);
    transform: scale(0.4);
  }
  100% {
    opacity: 1;
    -webkit-transform: scale(1);
    transform: scale(1);
  }
}
.spin-loading-wrap {
  margin: 20px;
  width: 45px;
  height: 45px;
  position: relative;
  .sk-child {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    &::before {
      content: "";
      display: block;
      margin: 0 auto;
      width: 15%;
      height: 15%;
      background-color: #1dbb88;
      border-radius: 100%;
      -webkit-animation: sk-circleBounceDelay 1.2s infinite ease-in-out both;
      animation: sk-circleBounceDelay 1.2s infinite ease-in-out both;
    }
  }
  .sk-circle2 {
    -webkit-transform: rotate(30deg);
    -ms-transform: rotate(30deg);
    transform: rotate(30deg);
    &::before {
      -webkit-animation-delay: -1.1s;
      animation-delay: -1.1s;
    }
  }
  .sk-circle3 {
    -webkit-transform: rotate(60deg);
    -ms-transform: rotate(60deg);
    transform: rotate(60deg);
    &::before {
      -webkit-animation-delay: -1s;
      animation-delay: -1s;
    }
  }
  .sk-circle4 {
    -webkit-transform: rotate(90deg);
    -ms-transform: rotate(90deg);
    transform: rotate(90deg);
    &::before {
      -webkit-animation-delay: -0.9s;
      animation-delay: -0.9s;
    }
  }
  .sk-circle5 {
    -webkit-transform: rotate(120deg);
    -ms-transform: rotate(120deg);
    transform: rotate(120deg);
    &::before {
      -webkit-animation-delay: -0.8s;
      animation-delay: -0.8s;
    }
  }
  .sk-circle6 {
    -webkit-transform: rotate(150deg);
    -ms-transform: rotate(150deg);
    transform: rotate(150deg);
    &::before {
      -webkit-animation-delay: -0.7s;
      animation-delay: -0.7s;
    }
  }
  .sk-circle7 {
    -webkit-transform: rotate(180deg);
    -ms-transform: rotate(180deg);
    transform: rotate(180deg);
    &::before {
      -webkit-animation-delay: -0.6s;
      animation-delay: -0.6s;
    }
  }
  .sk-circle8 {
    -webkit-transform: rotate(210deg);
    -ms-transform: rotate(210deg);
    transform: rotate(210deg);
    &::before {
      -webkit-animation-delay: -0.5s;
      animation-delay: -0.5s;
    }
  }
  .sk-circle9 {
    -webkit-transform: rotate(240deg);
    -ms-transform: rotate(240deg);
    transform: rotate(240deg);
    &::before {
      -webkit-animation-delay: -0.4s;
      animation-delay: -0.4s;
    }
  }
  .sk-circle10 {
    -webkit-transform: rotate(270deg);
    -ms-transform: rotate(270deg);
    transform: rotate(270deg);
    &::before {
      -webkit-animation-delay: -0.3s;
      animation-delay: -0.3s;
    }
  }
  .sk-circle11 {
    -webkit-transform: rotate(300deg);
    -ms-transform: rotate(300deg);
    transform: rotate(300deg);
    &::before {
      -webkit-animation-delay: -0.2s;
      animation-delay: -0.2s;
    }
  }
  .sk-circle12 {
    -webkit-transform: rotate(330deg);
    -ms-transform: rotate(330deg);
    transform: rotate(330deg);
    &::before {
      -webkit-animation-delay: -0.1s;
      animation-delay: -0.1s;
    }
  }
}
@-webkit-keyframes sk-circleBounceDelay {
  0%,
  80%,
  100% {
    -webkit-transform: scale(0);
    transform: scale(0);
  }
  40% {
    -webkit-transform: scale(1);
    transform: scale(1);
  }
}

@keyframes sk-circleBounceDelay {
  0%,
  80%,
  100% {
    -webkit-transform: scale(0);
    transform: scale(0);
  }
  40% {
    -webkit-transform: scale(1);
    transform: scale(1);
  }
}
</style>
