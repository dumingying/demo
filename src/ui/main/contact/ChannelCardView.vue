<template>
    <section @click.stop="" class="user-info-container">
        <div class="header">
            <div class="desc">
                <h2>{{ channelInfo.name }}</h2>
                <label>{{ channelInfo.desc }}</label>
            </div>
            <div>
                <img
                    class="avatar"
                    draggable="false"
                    v-bind:src="channelInfo.portrait"
                />
            </div>
        </div>
        <div class="action">
            <button
                v-if="isSubscribed"
                class="btn unsubscribe"
                @click.prevent="subscribe(false)"
            ></button>
            <button
                v-else
                class="btn subscribe"
                @click.prevent="subscribe(true)"
            ></button>
        </div>
    </section>
</template>

<script>
import wfc from "@/wfc/client/wfc";

export default {
    name: "ChannelCardView",
    props: {
        channelId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            channelInfo: null,
            isSubscribed: false,
        };
    },
    created() {
        this.channelInfo = wfc.getChannelInfo(this.channelId, false);
    },
    watch: {
        channelId() {
            this.isSubscribed = wfc.isListenedChannel(this.channelId);
        },
    },
    methods: {
        subscribe(toSubscribe) {
            wfc.listenChannel(this.channelId, toSubscribe, () => {
                let timer = setTimeout(() => {
                    this.isSubscribed = wfc.isListenedChannel(this.channelId);
                    timer && clearTimeout(timer);
                }, 2000);
            });
            this.close();
        },
        close() {
            this.$emit("close");
        },
    },
    mounted() {
        this.isSubscribed = wfc.isListenedChannel(this.channelId);
    },
};
</script>

<style lang="css" scoped>
.user-info-container {
    width: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #292a2c;
    background-color: #fcfcfc;
}

.user-info-container .avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
}

.header {
    width: calc(100% - 40px);
    margin: 10px 20px;
    padding-bottom: 20px;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid lightgray;
}

.header .desc {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
}

.content {
    width: 100%;
    text-align: left;
}

.content ul {
    border: 1px solid white;
    list-style: none;
    margin: 10px 20px;
}

.content ul li {
    margin-left: 0;
    height: 40px;
    line-height: 40px;
    display: flex;
}

.content ul li label {
    margin-right: 20px;
}

.content ul li .alias {
    border: none;
    background: none;
}

.content ul li .alias > input {
    width: 100%;
}

.content ul li > div {
    display: inline-block;
    flex: 1;
}

.action {
    width: calc(100% - 40px);
    display: flex;
    justify-content: flex-end;

    padding-top: 20px;
    padding-bottom: 10px;
}

.action .btn {
    border: none;
    width: 40px;
    height: 40px;
    background: #fff;
    border-radius: 20px;
    font-family: "PingFang SC";
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
    text-align: center;
    letter-spacing: 2px;
    color: #666666;
    position: relative;
}
.action .btn::before {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    display: block;
    content: "";
    width: 24px;
    height: 24px;
    background: url("../../../assets/images/unsubscribe.svg") no-repeat center;
    background-size: cover;
}
.action .subscribe.btn {
    /* background: #1dbb88; */
    color: #1dbb88;
}
.action .btn.subscribe::before {
    background: url("../../../assets/images/active-subscribe.svg") no-repeat
        center;
    background-size: cover;
}
</style>
