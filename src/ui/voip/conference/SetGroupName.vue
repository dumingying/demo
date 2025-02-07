<template>
  <div class="set-group-name">
    <h4>
      {{ title }}
      <span @click="handleCancel">
        <Icon type="ios-close"
              style="font-size: 36px" />
      </span>
    </h4>
    <input type="text"
           ref="input"
           v-model="groupName"
           :placeholder="placeholder"
           :maxlength="maxlength"
           @input="handleGroupName"
           @contextmenu.prevent="openMenu" />
    <div :class="['btn-wrap', { active: groupName || !isRequired }]"
         @click="confirm">
      {{ $t("common.confirm") }}
    </div>
    <!-- menu 操作栏 -->
    <right-click-menu ref="menuComponent"
                      :inputText="groupName"
                      @resetInputText="resetInputText"></right-click-menu>
  </div>
</template>

<script>
import RightClickMenu from '@/ui/common/rightClick/RightClickMenu'
export default {
  name: 'SetGroupName',
  props: {
    title: {
      type: String,
      default: ''
    },
    defaultGroupName: {
      type: String,
      default: ''
    },
    maxlength: {
      type: Number,
      default: 60
    },
    placeholder: {
      type: String,
      //   default: "请输入群组名称",
      default: ''
    },
    warningText: {
      type: String,
      //   default: "请输入内容",
      default: ''
    },
    isRequired: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      groupName: ''
    }
  },
  created() {
    this.groupName = this.defaultGroupName
  },
  methods: {
    handleGroupName(e) {
      this.$nextTick(() => {
        this.groupName = e.target.value.replace(/\s*/g, '')
      })
    },
    handleCancel() {
      if (this.isRequired && !this.groupName) {
        this.$Message.error(this.warningText)
        return
      }
      this.$modal.hide('SetGroupName-modal')
    },
    confirm() {
      if (!this.groupName && this.isRequired) return
      this.$modal.hide('SetGroupName-modal', { groupName: this.groupName })
    },
    openMenu($event) {
      this.$refs.menuComponent.$refs.menu.open($event)
    },
    resetInputText() {
      this.groupName = ''
    }
  },
  components: { RightClickMenu }
}
</script>
<style lang="less" scoped>
.set-group-name {
  text-align: center;
  padding-top: 15px;
  h4 {
    text-align: center;
    vertical-align: middle;
    font-size: 16px;
    position: relative;
    height: 30px;
    line-height: 30px;
    margin: 0 10px;
    span {
      position: absolute;
      top: 0;
      right: 0;
      height: 30px;
    }
  }

  input {
    margin-top: 20px;
    height: 36px;
    line-height: 36px;
    width: calc(100% - 48px);
    border: none;
    outline: none;
    border: 1px solid #ccc;
    border-radius: 3px;
    line-height: 24px;
    padding: 0 5px;
    box-sizing: border-box;
    &:focus,
    &:active {
      border: 1px solid #1dbb88;
    }
  }
  .btn-wrap {
    padding: 0 20px;
    margin-top: 30px;
    height: 48px;
    line-height: 48px;
    border-top: 1px solid #ddd;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    color: #1dbb88;
    opacity: 0.5;
    font-size: 14px;
    font-weight: bold;
    &.active {
      opacity: 1;
    }
  }
}
</style>
