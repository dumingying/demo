<template>
  <div :class="['toast', !type ? 'default' : '']" v-show="isShow">
    <div class="loading-icon" v-show="type === 'loading'">
      <div v-for="i in 11" :class="['sk-child', `sk-circle${i}`]" :key="i"></div>
    </div>
    <i class="icon icon-success" v-show="type === 'success'"></i>
    <i class="icon icon-error" v-show="type === 'error'"></i>
    <i class="icon icon-warn" v-show="type === 'warn'"></i>
    <p class="text-content" v-html="text"></p>
  </div>
</template>
<script>
export default {
  data: () => ({
    isShow: false,
    text: "",
    time: 1500,
    type: "loading",
  }),
  methods: {
    show(options) {
      console.log(options);
      //   if (typeof options === "string") {
      //     this.text = options;
      //   } else if (typeof options === "object") {
      //     Object.assign(this, options);
      //   }
      let { text, type, time } = options;
      // this.toast.set('text', text)
      // this.toast.set('type', type)
      // this.toast.set('time', time)
      this.text = text;
      this.type = type;
      this.time = time;
      this.isShow = true;
      if (this.type === "loading") {
        let timer = setTimeout(() => {
          this.isShow = false;
          timer && clearTimeout(timer);
        }, 30000);
      } else {
        let timer = setTimeout(() => {
          this.isShow = false;
          timer && clearTimeout(timer);
        }, this.time || 1000);
      }
    },
    hide() {
      this.isShow = false;
    },
  },
};
</script>
<style scoped>
.toast {
  position: fixed;
  z-index: 99999;
  padding: 10px;
  min-width: 120px;
  min-height: 120px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(55, 55, 55, 0.7);
  text-align: center;
  border-radius: 5px;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}
.toast.default {
  min-width: 120px;
  min-height: 30px;
  background: rgba(55, 55, 55, 0.9);
}

.toast .icon {
  margin-top: 10px;
  color: #fff;
  width: 45px;
  height: 45px;
}
.toast .icon::before {
  content: "";
  width: 100%;
  height: 100%;
  display: block;
  background-repeat: no-repeat;
  background-position: center center;
}
.toast .icon-success:before {
  background-image: url("../../assets/images/success-icon.png");
  background-size: 45px auto;
}
.toast .icon-error:before {
  background-image: url("../../assets/images/error-icon.png");
  background-size: 45px auto;
}
.toast .icon-warn::before {
  background-image: url("../../assets/images/warning-icon.png");
  background-size: 45px auto;
}
.toast .text-content {
  margin: 0 0 15px;
}
.toast.default .text-content {
  margin: 0;
}
/** 加载动画的静态样式 **/
/** 加载动画 **/
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
.loading-icon {
  margin: 20px;
  width: 45px;
  height: 45px;
  position: relative;
}
.loading-icon .sk-child {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
}
.loading-icon .sk-child:before {
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
.loading-icon .sk-circle2 {
  -webkit-transform: rotate(30deg);
  -ms-transform: rotate(30deg);
  transform: rotate(30deg);
}
.loading-icon .sk-circle3 {
  -webkit-transform: rotate(60deg);
  -ms-transform: rotate(60deg);
  transform: rotate(60deg);
}
.loading-icon .sk-circle4 {
  -webkit-transform: rotate(90deg);
  -ms-transform: rotate(90deg);
  transform: rotate(90deg);
}
.loading-icon .sk-circle5 {
  -webkit-transform: rotate(120deg);
  -ms-transform: rotate(120deg);
  transform: rotate(120deg);
}
.loading-icon .sk-circle6 {
  -webkit-transform: rotate(150deg);
  -ms-transform: rotate(150deg);
  transform: rotate(150deg);
}
.loading-icon .sk-circle7 {
  -webkit-transform: rotate(180deg);
  -ms-transform: rotate(180deg);
  transform: rotate(180deg);
}
.loading-icon .sk-circle8 {
  -webkit-transform: rotate(210deg);
  -ms-transform: rotate(210deg);
  transform: rotate(210deg);
}
.loading-icon .sk-circle9 {
  -webkit-transform: rotate(240deg);
  -ms-transform: rotate(240deg);
  transform: rotate(240deg);
}
.loading-icon .sk-circle10 {
  -webkit-transform: rotate(270deg);
  -ms-transform: rotate(270deg);
  transform: rotate(270deg);
}
.loading-icon .sk-circle11 {
  -webkit-transform: rotate(300deg);
  -ms-transform: rotate(300deg);
  transform: rotate(300deg);
}
.loading-icon .sk-circle12 {
  -webkit-transform: rotate(330deg);
  -ms-transform: rotate(330deg);
  transform: rotate(330deg);
}
.loading-icon .sk-circle2:before {
  -webkit-animation-delay: -1.1s;
  animation-delay: -1.1s;
}
.loading-icon .sk-circle3:before {
  -webkit-animation-delay: -1s;
  animation-delay: -1s;
}
.loading-icon .sk-circle4:before {
  -webkit-animation-delay: -0.9s;
  animation-delay: -0.9s;
}
.loading-icon .sk-circle5:before {
  -webkit-animation-delay: -0.8s;
  animation-delay: -0.8s;
}
.loading-icon .sk-circle6:before {
  -webkit-animation-delay: -0.7s;
  animation-delay: -0.7s;
}
.loading-icon .sk-circle7:before {
  -webkit-animation-delay: -0.6s;
  animation-delay: -0.6s;
}
.loading-icon .sk-circle8:before {
  -webkit-animation-delay: -0.5s;
  animation-delay: -0.5s;
}
.loading-icon .sk-circle9:before {
  -webkit-animation-delay: -0.4s;
  animation-delay: -0.4s;
}
.loading-icon .sk-circle10:before {
  -webkit-animation-delay: -0.3s;
  animation-delay: -0.3s;
}
.loading-icon .sk-circle11:before {
  -webkit-animation-delay: -0.2s;
  animation-delay: -0.2s;
}
.loading-icon .sk-circle12:before {
  -webkit-animation-delay: -0.1s;
  animation-delay: -0.1s;
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
