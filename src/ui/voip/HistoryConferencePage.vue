<template>
  <div class="history-conference-container">
    <!-- 左侧 -->
    <history-conference-nav></history-conference-nav>
    <!-- 右侧 -->
    <history-conference-view></history-conference-view>
  </div>
</template>
<script>
import HistoryConferenceNav from './conference/history/HistoryConferenceNav'
import HistoryConferenceView from './conference/history/HistoryConferenceView'
export default {
  components: {
    HistoryConferenceNav,
    HistoryConferenceView
  },
  data() {
    return {
      currentDetail: ''
    }
  },
  methods: {
    setCurrentHistory(data) {
      this.currentDetail = data
    }
  }
}
</script>
<style lang="less" scoped>
.history-conference-container {
  flex: 1;
  display: flex;
  width: 100%;
  height: 100%;
}
</style>
