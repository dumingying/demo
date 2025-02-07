<template>
    <div class="count-down">
        <p class="content">
            {{ $t("voip.countdown_exit_meeting", [count]) }}
        </p>
        <div class="footer">
            <button class="confirm" @click="handlerConfirm">
                {{ $t("voip.end_meeting") }} ({{ count }})
            </button>
            <button class="cancel" @click="handlerCancel">
                {{ $t("common.cancel") }}
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: "countdown-endMeeting-modal",
    props: {
        endMeetingFun: {
            type: Function,
        },
    },
    data() {
        return {
            timer: null,
            count: 3,
        };
    },
    created() {
        this.cutDownFun();
    },
    methods: {
        cutDownFun() {
            this.timer = setTimeout(() => {
                this.cutDownFun();
                this.count--;
                if (this.count <= 0) {
                    this.timer && clearTimeout(this.timer);
                    this.count = 0;
                    this.endMeetingFun();
                    this.$modal.hide("countdown-endMeeting-modal");
                }
            }, 1000);
        },
        handlerCancel() {
            this.timer && clearTimeout(this.timer);
            this.$modal.hide("countdown-endMeeting-modal");
        },
        handlerConfirm() {
            this.timer && clearTimeout(this.timer);
            this.endMeetingFun();
            this.$modal.hide("countdown-endMeeting-modal");
        },
    },
};
</script>
<style lang="less" scoped>
.count-down {
    display: flex;
    flex-direction: column;
    height: 100%;
    .content {
        flex: 1;
        overflow: auto;
        font-size: 14px;
        line-height: 24px;
        color: #333;
        padding: 20px;
        word-break: break-word;
        text-align: center;
        box-sizing: border-box;
    }
    .footer {
        height: 40px;
        display: flex;
        text-align: center;
        border-top: #eee solid 1px;
    }
    button {
        flex: 1;
        font-size: 14px;
        padding: 5px;
        border-radius: 4px;
        background: none;
        text-align: center;
        border: none;
        margin: 0 10px;
        color: #666;
    }

    .cancel {
        background: #fff;
        position: relative;
    }

    .confirm {
        color: #c42d19;
        font-weight: bold;
    }
    .cancel:before {
        content: "";
        background: #eee;
        width: 1px;
        height: 20px;
        position: absolute;
        left: -10px;
    }
}
</style>
