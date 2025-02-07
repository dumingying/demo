<template>
  <section>
    <ul class="list-wrap">
      <li v-for="channelItem in channelList"
          :key="channelItem.category">
        <div ref="contactItem"
             class="contact-item">
          <div v-if="showCategoryLabel"
               class="label">
            <p>{{ channelItem.category.toUpperCase() }}</p>
          </div>
          <ul>
            <li v-for="item in channelItem.channels"
                :key="item.id">
              <div :class="['content',{active: activeChannel(item)}]"
                   @click.stop="showChannel(item)">
                <img class="avatar"
                     :src="item.portrait"
                     draggable="false" />
                <span class="single-line"> {{item.name }}</span>
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
export default {
  name: 'ChannelListView',
  props: {
    channels: {
      type: Array,
      required: true
    },
    showCategoryLabel: {
      type: Boolean,
      required: false,
      default: true
    },
    search: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      sharedContactState: store.state.contact
    }
  },
  computed: {
    channelList() {
      let channelList = []
      if (!this.showCategoryLabel) {
        channelList.push({
          category: 'not-show-category',
          channels: this.channels
        })
      } else {
        let current = { channels: [] }
        let lastCategory = null
        this.channels.forEach((item) => {
          if (!lastCategory || lastCategory !== item._category) {
            lastCategory = item._category
            current = {
              category: item._category,
              channels: [item]
            }
            channelList.push(current)
          } else {
            current.channels.push(item)
          }
        })
      }
      return channelList
    },
    activeChannel() {
      return (item) => {
        return (
          this.sharedContactState.currentChannel &&
          this.sharedContactState.currentChannel.channelId === item.channelId
        )
      }
    }
  },
  methods: {
    showChannel(channel) {
      store.setCurrentChannel(channel)
    }
  }
}
</script>

<style scoped>
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}
.list-wrap {
  width: 100%;
}
.list-wrap li {
  margin-bottom: 10px;
}
.contact-item {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  align-items: flex-start;
}

.contact-item .label {
  padding-left: 30px;
  width: 100%;
}

.contact-item .label p {
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

.contact-item .content {
  padding: 6px 0 0 30px;
  display: flex;
  width: 100%;
  align-items: center;
}
.contact-item ul {
  width: 100%;
}
.contact-item .content span {
  margin-left: 10px;
  color: #222222;
}

.contact-item .content.active,
.contact-item .content:active {
  background-color: #eceef4;
}
</style>
