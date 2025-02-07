<template>
  <ul class='tree-item'>
    <li v-for='(item,index) in datalist'
        :key='item.folderDto.id'>
      <div class="father-wrap">
        <p class="icon-name"
           @click="chooseFile(item.folderDto.id,index)">
          <span class='iconChange'>
            <Icon type="ios-folder-open"
                  v-if='isOpen[index]' />
            <Icon type="ios-folder"
                  v-if='!isOpen[index]' />
          </span>
          <span :class="['filename new-single-line',{' chooseThisFile':item.folderDto.id===saveID}]">{{item.folderDto.folderName}}</span>
        </p>
        <span class="select-icon"
              @click="toggle(index)">
          <Icon type="md-remove"
                v-if='isOpen[index]' />
          <Icon type="md-add"
                v-else />
        </span>
      </div>
      <tree-item :datalist='item.subFolderTree'
                 v-if='isOpen[index]'
                 :saveID='saveID'></tree-item>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'treeItem',
  props: {
    datalist: {
      type: Array,
      default: []
    },
    saveID: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isOpen: []
    }
  },
  methods: {
    toggle(index) {
      this.$set(this.isOpen, index, !this.isOpen[index])
    },
    fillIndex() {
      if (this.datalist) {
        this.datalist.forEach((val, index) => {
          if (val._isOpen && !index) {
            this.isOpen[index] = true
          } else {
            this.isOpen[index] = false
          }
        })
      }
    },
    chooseFile(id) {
      this.$eventBus.$emit('getIdItem', id)
    }
  },
  watch: {
    datalist() {
      //由于无法props异步传值 mounted获取不到 需要进行监听
      this.fillIndex()
    }
  },
  mounted() {
    this.fillIndex('init')
  }
}
</script>

<style lang="less" scoped>
.tree-item {
  padding-left: 10px;
  box-sizing: border-box;
  li {
    display: flex;
    flex-direction: column;
    margin-top: 14px;
    .father-wrap {
      display: flex;
      .icon-name {
        flex: 1;
        display: flex;
        line-height: 22px;
        .filename {
          font-size: 14px;
          margin-left: 10px;
        }
      }
    }

    span {
      &.select-icon {
        width: 60px;
        height: 20px;
        text-align: right;
        i {
          font-size: 16px;
          color: #999;
          height: 14px;
          margin-right: 10px;
        }
      }
    }
  }
}

.chooseThisFile {
  color: #1dbb88;
  font-weight: bold;
}
.iconChange {
  cursor: pointer;
  i {
    color: rgba(106, 171, 255, 1);
    font-size: 16px;
  }
}
</style>
