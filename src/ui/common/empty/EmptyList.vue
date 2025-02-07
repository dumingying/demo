<template>
  <figure class="empty-container">
    <img src="../../../assets/images/empty-icon.png"
         width="120"
         draggable="false" />
    <p>
      <slot></slot>
    </p>
  </figure>
</template>

<script>
export default {
  name: 'EmptyList',
  data() {
    return {}
  }
}
</script>
<style lang='less' scoped>
.empty-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 30px;

  p {
    margin-top: 10px;
    color: #999;
    font-size: 12px;
  }
}
</style>
