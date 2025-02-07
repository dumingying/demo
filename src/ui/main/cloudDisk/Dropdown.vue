<template>
  <div class="dropdown-container">
    <p v-for="item in listData" :key="item.type" @click="doOperate(item.type)">
      {{ item.listName }}
    </p>
  </div>
</template>

<script>
export default {
  props: ["width", "list-data"],
  data() {
    return {};
  },
  methods: {
    doOperate(value) {
      this.$emit("operate", value);
    },
  },
};
</script>

<style lang="less" scoped>
.dropdown-container {
  width: 100px;
  position: absolute;
  top: 30px;
  left: -15px;
  background-color: rgba(25, 26, 31, 0.79);
  border-radius: 4px;
  z-index: 80;
  padding: 6px 0;
  p {
    text-align: center;
    font-size: 12px;
    padding: 8px 0;
    font-weight: 600;
    color: #fff;
    line-height: 20px;
    &:hover {
      cursor: pointer;
      color: #1dbb88;
    }
  }
}
</style>
