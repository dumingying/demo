<template>
  <div class="notification-container">
    <p class="notification">{{ message.messageContent.digest(message) }}</p>
  </div>
</template>

<script>
import Message from '@/wfc/messages/message'

export default {
  name: 'NotificationMessageContentView',
  props: {
    message: {
      type: Message,
      required: true
    }
  },
  components: {}
}
</script>

<style lang="css" scoped>
.notification-container {
  display: flex;
  justify-content: center;
}

.notification-container .notification {
  max-width: 80%;
  color: #b8b8b8;
  margin: 20px;
  font-size: 14px;
}
</style>
