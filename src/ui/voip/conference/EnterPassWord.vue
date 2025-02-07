<template>
  <div class="enter-pass-word">
    <h4>{{ title }}</h4>
    <div class="pass-word">
      <input :type="isText ? 'text' : 'password'"
             ref="input"
             v-model="meetingPassWord"
             autofocus
             :maxlength="6"
             :minlength="4"
             @keypress="keyPress"
             @input="setMeetingPassWord"
             @contextmenu.prevent="openMenu"
             :placeholder="$t('voip.enter_pw')" />
      <Icon class="clear"
            type="md-close"
            v-if="meetingPassWord"
            @click="resetInputText" />
      <i :class="['eye', { close: !isText }]"
         v-if="meetingPassWord"
         @click="handleToggle"></i>
    </div>
    <div class="btn-wrap">
      <span class="btn cancel"
            @click="handleCancel">{{ $t("common.cancel") }}</span>
      <span class="btn join"
            @click="handleJoin">{{ $t("common.join") }}</span>
    </div>
    <!-- 右击 更多操作 -->
    <right-click-menu ref="menuComponent"
                      :inputText="meetingPassWord"
                      @resetInputText="resetInputText"></right-click-menu>
  </div>
</template>

<script>
import RightClickMenu from '@/ui/common/rightClick/RightClickMenu'
export default {
  name: 'EnterPassWord',
  props: {
    title: {
      type: String,
      default: ''
    }
  },
  components: { RightClickMenu },
  data() {
    return {
      meetingPassWord: '',
      isText: false
    }
  },
  methods: {
    setMeetingPassWord(e) {
      this.$nextTick(() => {
        this.meetingPassWord = e.target.value.replace(/[^\d]/g, '')
      })
    },
    //实现只能输入纯数字
    keyPress() {
      var myEvent = event || window.event
      var keyCode = myEvent.keyCode //这里做了兼容性处理
      if (keyCode >= 48 && keyCode <= 57) {
        event.returnValue = true
      } else {
        event.returnValue = false
      }
    },
    handleCancel() {
      this.$modal.hide('EnterPassWord-modal')
    },
    handleJoin() {
      if (!this.meetingPassWord) {
        this.$Message.warning(this.$t('voip.enter_pw'))
        return
      }
      if (this.meetingPassWord.length < 4 || this.meetingPassWord.length > 6) {
        this.$Message.warning(this.$t('voip.enter_tip'))
        return
      }
      this.$modal.hide('EnterPassWord-modal', {
        params: true,
        meetingPassWord: this.meetingPassWord
      })
    },
    openMenu($event) {
      this.$refs.menuComponent.$refs.menu.open($event)
    },
    resetInputText() {
      this.meetingPassWord = ''
    },
    handleToggle() {
      this.isText = !this.isText
    }
  }
}
</script>
<style lang="less" scoped>
.enter-pass-word {
  text-align: center;
  padding: 15px 20px;
  h4 {
    font-size: 14px;
  }

  .pass-word {
    display: flex;
    border: 1px solid #ccc;
    border-radius: 3px;
    padding: 0 5px;
    box-sizing: border-box;
    width: 260px;
    margin-top: 20px;
    align-items: center;

    input {
      height: 30px;
      line-height: 30px;
      border: none;
      outline: none;
      flex: 1;
    }
    .clear {
      margin: 0 8px;
      font-size: 14px;
      font-style: normal;
    }
    .eye {
      width: 22px;
      height: 22px;
      background: url(../../../assets/images/password-close.svg) no-repeat
        center center;
      background-size: 16px;
      &.close {
        background: url(../../../assets/images/password-open.svg) no-repeat
          center center;
        background-size: 16px;
      }
    }
  }

  .btn-wrap {
    margin-top: 30px;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    .btn {
      width: 84px;
      margin: 0 5px;
      color: #515a6e;
      border-radius: 3px;
      height: 26px;
      line-height: 26px;
    }
    .cancel {
      border: 1px solid #ccc;
    }
    .join {
      color: #fff;
      background: #1dbb88;
    }
  }
}
</style>
