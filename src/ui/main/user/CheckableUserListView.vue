<template>
  <section>
    <ul>
      <li v-for="groupedUser in groupedUsers"
          :key="groupedUser.category">
        <div ref="contactItem"
             class="contact-item">
          <div v-if="showCategoryLabel"
               class="label"
               :style="paddingStyle"
               v-bind:class="{ sticky: enableCategoryLabelSticky }">
            <p>{{ groupedUser.category.toUpperCase() }}</p>
          </div>
          <ul>
            <li v-for="user in groupedUser.users"
                :key="user.uid">
              <div class="content"
                   :id="'user-' + user.uid"
                   :style="paddingStyle"
                   :class="{ disabled: isUserUncheckable(user) }"
                   @click.stop="clickUserItem(user)">
                <label class="checkbox-wrap">
                  <input class="checkbox"
                         type="checkbox"
                         v-bind:value="user"
                         :disabled="isUserUncheckable(user)"
                         :checked="isUserChecked(user)" />
                  <span></span>
                </label>
                <img class="avatar"
                     @error="mixinImgUrlAlt"
                     draggable="false"
                     :src="user.portrait" />
                <span class="new-single-line name">
                  {{ showUserName(user) }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </section>
</template>

<script>
import store from '@/store'

import ConversationInfo from '@/wfc/model/conversationInfo'
export default {
  name: 'CheckableUserListView',
  props: {
    enablePick: {
      type: Boolean,
      default: false
    },
    users: {
      type: Array,
      required: true
    },
    initialCheckedUsers: {
      type: Array,
      required: false,
      default: null
    },
    uncheckableUsers: {
      type: Array,
      required: false,
      default: null
    },
    showCategoryLabel: {
      type: Boolean,
      required: false,
      default: true
    },
    enableCategoryLabelSticky: {
      type: Boolean,
      required: false,
      default: false
    },
    paddingLeft: {
      type: String,
      required: false,
      default: '5px'
    },
    search: {
      type: String,
      default: ''
    },
    // 根据来源处理对应的页面需求
    from: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      sharedPickState: store.state.pick,
      sharedContactState: store.state.contact
    }
  },
  methods: {
    clickUserItem(user) {
      if (this.isUserUncheckable(user)) {
        return
      }
      if (this.from === 'designated') {
        user._designatedFrom = true
      }
      store.pickOrUnpickUser(user)

      if (this.from === 'designated') {
        this.$parent.removeFromGroupFriend(user)
      }
    },

    isUserInitialChecked(user) {
      return (
        this.initialCheckedUsers &&
        this.initialCheckedUsers.findIndex((u) => u.uid === user.uid) >= 0
      )
    },

    isUserUncheckable(user) {
      return (
        this.uncheckableUsers &&
        this.uncheckableUsers.findIndex((u) => u.uid === user.uid) >= 0
      )
    },

    isUserChecked(user) {
      return store.isUserPicked(user)
    }
  },
  mounted() {
    if (this.initialCheckedUsers) {
      // why?
      // 1. checkbox :checked 和 v-model冲突，以v-model为准
      // 2. v-model 的实现里，应当是采用引用比较，而不是值比较
      let oriCUs = this.users.filter(
        (u) => this.initialCheckedUsers.findIndex((iu) => iu.uid === u.uid) > -1
      )
      oriCUs.forEach((u) => store.pickOrUnpickUser(u))
    }
  },
  computed: {
    groupedUsers() {
      let groupedUsers = []
      if (!this.showCategoryLabel) {
        groupedUsers.push({
          category: '',
          users: this.users
        })
        return groupedUsers
      }
      let current = { users: [] }
      let lastCategory = null
      this.users.forEach((user) => {
        if (!lastCategory || lastCategory !== user._category) {
          lastCategory = user._category
          current = {
            category: user._category,
            users: [user]
          }
          groupedUsers.push(current)
        } else {
          current.users.push(user)
        }
      })
      return groupedUsers
    },
    paddingStyle() {
      return {
        paddingLeft: this.paddingLeft
      }
    },
    showUserName() {
      return (user) => {
        return ConversationInfo &&
          ConversationInfo.anonymous_memberList &&
          ConversationInfo.anonymous_memberList.length &&
          !this.showCategoryLabel
          ? user._displayName || this.$t('common.user')
          : this.mixinGetUserName(user)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.contact-item {
  --user-item-padding-left: 30px;
}

ul {
  list-style: none;
  width: 100%;
}
.contact-item {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  align-items: flex-start;
}

.contact-item .label {
  width: 100%;
  background-color: #f7f7f7;
}

.contact-item .label p {
  margin-top: 10px;
  height: 30px;
  line-height: 30px;
  position: relative;
}
.contact-item .label p:after {
  position: absolute;
  top: 29px;
  right: 0;
  content: '';
  width: 100%;
  height: 0.5px;
  background: #dddddd;
  opacity: 0.5;
}

.contact-item .label.sticky {
  position: sticky;
  top: 0;
  z-index: 99;
}

.contact-item .content {
  padding: 10px 5px 10px 0;
  display: flex;
  width: 100%;
  align-items: center;
}

.contact-item .content .name {
  flex: 1;
  margin-left: 10px;
  color: #000;
}

.contact-item .content.active,
.contact-item .content:active {
  background-color: #eceef4;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-left: 5px;
}

.checkbox-wrap {
  margin-left: 10px;
  width: 18px;
  height: 18px;
  position: relative;
  .checkbox {
    width: 18px;
    height: 18px;
    border: none;
    top: 0;
    opacity: 0;
    position: absolute;
    right: 0;
    z-index: 1;
  }
  .checkbox + span {
    position: absolute;
    width: 18px;
    height: 18px;
    z-index: 0;
    top: 0;
    right: 0;
    border: 1px solid #ccc;
    border-radius: 50%;
    overflow: hidden;
  }
  .checkbox:checked + span,
  .checkbox:disabled + span {
    border: 0;
    background: #1dbb88 url(../../../assets/images/ok-icon.png) no-repeat center
      center;
    background-size: 10px auto;
  }
}

.disabled {
  pointer-events: none;
  opacity: 0.4;
}
</style>
