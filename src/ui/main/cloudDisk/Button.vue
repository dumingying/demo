<template>
  <button type='button'>{{text}}</button>
</template>

<script>
export default {
  props: ['text']
}
</script>
<style lang="less" scoped>
button {
  min-width: 60px;
  height: 30px;
  background-color: #ffffff;
  border-radius: 4px;
  border: solid 1px rgba(151, 151, 151, 0.2);
  font-size: 12px;
  padding: 3px 5px;
  cursor: pointer;
  &:focus {
    outline: 0;
  }
}
</style>
