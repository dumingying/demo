<template>
  <div class="edit-group-name">
    <div v-if="enableEditGroupName"
         class="edit-wrap">
      <h3>{{ $t("conversation.edit_group_name") }}</h3>
      <p>{{ $t("conversation.notified_group") }}</p>
      <div class="info-wrap">
        <figure>
          <img :src="groupInfo.portrait"
               draggable="false" />
        </figure>
        <div class="input-wrap">
          <input type="text"
                 v-model="groupName"
                 autofocus
                 :maxlength="60" />
          <Icon type="ios-close"
                @click="handlerEmpty"
                class="del-btn" />
        </div>
      </div>
    </div>
    <div v-else
         class="tip-wrap">{{ $t("conversation.cant_modified") }}</div>
    <div class="footer">
      <button v-if="enableEditGroupName"
              @click="cancel"
              class="cancel-btn">
        {{ $t("common.cancel") }}
      </button>
      <button @click="confirm"
              :class="['confirm-btn', { disabled: inputDisabled }]"
              :disabled="enableEditGroupName && groupName === groupInfo.name">
        {{ enableEditGroupName ? $t("common.confirm") : $t("setting.ok") }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditGroupNameView',
  props: {
    enableEditGroupName: {
      type: Boolean
    },
    groupInfo: {}
  },
  components: {},
  data() {
    return {
      groupName: ''
    }
  },
  computed: {
    inputDisabled() {
      return this.enableEditGroupName && this.groupName === this.groupInfo.name
    }
  },
  created() {
    this.groupName = this.groupInfo.name
  },
  methods: {
    handlerEmpty() {
      this.groupName = ''
    },
    cancel() {
      this.$modal.hide('edit-group-name-view', { confirm: false })
    },
    confirm() {
      this.$modal.hide('edit-group-name-view', {
        confirm: true,
        groupName: this.groupName || this.groupInfo.name
      })
    }
  }
}
</script>
<style lang="less" scoped>
.edit-group-name {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .tip-wrap {
    display: flex;
    text-align: center;
    line-height: 24px;
    flex: 1;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  .edit-wrap {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 10px 20px;
    h3 {
      padding: 8px 0;
      text-align: center;
      line-height: 24px;
    }
    p {
      text-align: center;
    }
    .info-wrap {
      margin-top: 12px;
      display: flex;
      align-items: center;
      figure {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 10px;
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      .input-wrap {
        position: relative;
        flex: 1;
        height: 32px;
        input {
          width: 100%;
          height: 32px;
          border: 1px solid #eee;
          border-radius: 4px;
          padding-left: 5px;
          padding-right: 24px;
          outline: none;
          &:active {
            width: 100%;
            border: 1px solid #1dbb88;
          }
          &:focus {
            width: 100%;
            border: 1px solid #1dbb88;
          }
        }
        .del-btn {
          font-size: 24px;
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          text-align: center;
          line-height: 20px;
        }
      }
    }
  }

  .footer {
    border-top: 1px solid #eee;
    text-align: center;
    padding: 10px;
    button {
      background: none;
      border: none;
      width: 120px;
      display: inline-block;
      font-size: 12px;
      padding: 8px 0;
    }
    .cancel-btn {
      border-right: 1px solid #eee;
    }
    .confirm-btn {
      color: #1dbb88;
      &.disabled {
        opacity: 0.4;
      }
    }
  }
}
</style>
