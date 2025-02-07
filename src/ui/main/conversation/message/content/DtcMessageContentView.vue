<template>
    <div
        class="dtc-message-container"
        v-bind:class="{ out: message.direction === 0 }"
    >
        {{ textContent }}
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";

export default {
    name: "DtcMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },
    },
    data() {
        return {};
    },
    computed: {
        textContent() {
            if (this.message !== null) {
                return this.message.direction === 0
                    ? this.$t("dtc.send")
                    : this.$t("dtc.receive");
            }
        },
    },
    methods: {},
};
</script>

<style lang="css" scoped>
.dtc-message-container {
    min-width: 20px;
    margin: 0 10px;
    padding: 12px 16px;
    line-height: 22px;
    background-color: white;
    position: relative;
    border-radius: 5px;
    display: flex;
    align-items: center;
    color: #050505;
}

.dtc-message-container.out {
    background-color: #1dbb88;
    color: #fff;
}
</style>
