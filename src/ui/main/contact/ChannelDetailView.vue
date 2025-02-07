<template>
    <Scroll
        :on-reach-bottom="handleReachBottom"
        height="100%"
        :class="isWinClass"
        :distance-to-edge="20"
        :loading-text="$t('common.loading')"
    >
        <section class="channel-info-container">
            <div class="share-btn" @click.stop="goShare"></div>
            <div class="portrait-bg">
                <img
                    @error="mixinImgUrlAlt"
                    draggable="false"
                    :src="sharedContactState.currentChannel.portrait"
                />
            </div>
            <div class="channel-info">
                <div class="info-wrap">
                    <div class="portrait-name">
                        <figure>
                            <img
                                @error="mixinImgUrlAlt"
                                draggable="false"
                                :src="
                                    sharedContactState.currentChannel.portrait
                                "
                            />
                        </figure>
                        <p>{{ sharedContactState.currentChannel.name }}</p>
                    </div>
                    <p class="channel-introduce">
                        {{ sharedContactState.currentChannel.desc }}
                    </p>
                    <div class="channel-action">
                        <template v-if="isSubscribed">
                            <button
                                class="btn unsubscribe"
                                @click="subscribeChannel"
                            >
                                {{ $t("channel.unsubscribe") }}
                            </button>
                            <button class="btn chat" @click="chat">
                                {{ $t("channel.chat") }}
                            </button>
                        </template>
                        <button
                            v-else
                            class="btn subscribe"
                            @click="subscribeChannel"
                        >
                            {{ $t("channel.subscribe") }}
                        </button>
                    </div>
                </div>
                <template v-if="articleList && articleList.length">
                    <h4>{{ $t("channel.articles") }}</h4>
                    <ul class="channel-article-list">
                        <li
                            v-for="article in articleList"
                            :key="article.id"
                            @click="goWeb3Page(article)"
                        >
                            <figure>
                                <img
                                    :src="article.image"
                                    draggable="false"
                                    alt=""
                                />
                            </figure>
                            <div class="info">
                                <p class="second-line">{{ article.title }}</p>
                                <div class="footer">
                                    <span class="date">{{
                                        article.updateTime
                                    }}</span>
                                </div>
                            </div>
                        </li>
                    </ul>
                </template>
            </div>
        </section>
    </Scroll>
</template>

<script>
import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";
import ChannelCardMessageContent from "@/wfc/messages/customMessages/channelCardMessageContent";
import ConversationType from "@/wfc/model/conversationType";
import Conversation from "@/wfc/model/conversation";
import Message from "@/wfc/messages/message";

import { channelArticleList } from "@/axios";

import wfc from "@/wfc/client/wfc";
import store from "@/store";

export default {
    name: "ChannelDetailView",
    data() {
        return {
            sharedContactState: store.state.contact,
            sharedMiscState: store.state.misc,
            isSubscribed: false,
            //   分页查询，currPage(当前页数)， pageSize(每页数量)， totalCount(总数)，totalPage(总页数)
            submitInfo: {
                page: 1,
                limit: 50,
            },
            totalPage: 0, // 总页数
            articleList: [],
            lock: false,
        };
    },
    created() {
        this.isSubscribed = this.isSubscribedChannel();
        this.getArticleList();
    },
    watch: {
        currentChannel() {
            this.isSubscribed = this.isSubscribedChannel();
            this.submitInfo.page = 1;
            this.articleList = [];
            this.getArticleList();
        },
    },
    computed: {
        currentChannel() {
            return this.sharedContactState.currentChannel;
        },
        isWinClass() {
            return process.platform === "darwin" ? "mac" : "win";
        },
    },
    methods: {
        chat() {
            let conversation = new Conversation(
                ConversationType.Channel,
                this.currentChannel.channelId,
                0
            );
            store.setCurrentConversation(conversation);
            this.$router.replace("/home/conversation");
        },
        isSubscribedChannel() {
            return wfc.isListenedChannel(this.currentChannel.channelId);
        },

        subscribeChannel() {
            // 取消或者关注失败
            store.subscribeChannel(
                this.currentChannel.channelId,
                !this.isSubscribedChannel(),
                (err) => {
                    if (err) {
                        // 取消或者关注失败
                        this.$Message.warning(
                            this.isSubscribed
                                ? $t("channel.unfollow_failure")
                                : $t("channel.follow_failure")
                        );
                    } else {
                        // 取消或者关注成功
                        this.isSubscribed = !this.isSubscribed;
                        // setTimeout(() => {
                        //   console.log(this.isSubscribedChannel())
                        // }, 2000)
                    }
                }
            );
        },
        handleReachBottom() {
            return new Promise((resolve) => {
                let timer = setTimeout(() => {
                    if (!this.totalPage) return;
                    this.submitInfo.page++;
                    if (this.submitInfo.page <= this.totalPage) {
                        this.getArticleList();
                    } else {
                        this.$Message.warning(this.$t("channel.no_more"));
                    }
                    resolve();
                    timer && clearTimeout(timer);
                }, 1000);
            });
        },
        goWeb3Page(article) {
            if (article.targetLink) {
                this.mixinGo2Web3View(article.targetLink);
            }
        },
        goShare() {
            let { channelId, name, portrait, desc } = this.currentChannel;
            let message = new Message();
            let messageContent = new ChannelCardMessageContent(
                channelId,
                name,
                desc,
                portrait,
                name
            );
            message.messageContent = messageContent;
            this.$forwardMessage({
                forwardType: ForwardType.NORMAL,
                messages: [message],
                isCallBack: true,
            })
                .then((data) => {
                    if (data !== "cancel") {
                        store.forwardAnonymousGroupMessage(data, true);
                        this.$Message.success(this.$t("friend_request.sent"));
                    }
                })
                .catch(() => {});
        },
        // 获取文章列表
        async getArticleList() {
            if (this.lock) return;
            this.lock = true;
            try {
                let res = await channelArticleList({
                    ...this.submitInfo,
                    articleOwnerId:
                        this.sharedContactState.currentChannel.channelId,
                    userId: wfc.getUserId(),
                });
                this.lock = false;
                let { data, message, code } = res.data;
                if (code === "000000") {
                    this.articleList = [...this.articleList, ...data.list];
                    this.totalPage = data.totalPage;
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.lock = false;
                console.log(error);
            }
        },
    },
};
</script>
<style lang="css" scoped>
.channel-info-container {
    margin-top: -10px;
    display: flex;
    height: 100%;
    flex-direction: column;
    align-items: center;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
    overflow-y: auto;
    position: relative;
}
.channel-info-container .share-btn {
    width: 18px;
    height: 18px;
    position: absolute;
    background: url(../../../assets/images/share.png) no-repeat center;
    z-index: 2;
    top: 20px;
    right: 20px;
}

.channel-info-container .portrait-bg {
    position: absolute;
    width: 100%;
    height: 240px;
    filter: blur(10px);
    z-index: 1;
    overflow: hidden;
}
.channel-info-container .portrait-bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.channel-info {
    width: 340px;
    position: relative;
    z-index: 2;
    margin-top: 100px;
}
.channel-info .info-wrap {
    padding: 0 20px 20px;
    box-sizing: border-box;
    min-height: 268px;
    background: #fff;
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.channel-info .info-wrap .portrait-name {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.channel-info .info-wrap .portrait-name figure {
    margin-top: -40px;
    height: 80px;
    width: 80px;
    border-radius: 50%;
    border: 6px solid #fff;
    overflow: hidden;
}
.channel-info .info-wrap .portrait-name figure img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.channel-info .info-wrap .portrait-name p {
    margin-top: 6px;
    font-style: normal;
    font-weight: 400;
    font-size: 24px;
    line-height: 33px;
    text-align: center;
    color: #222222;
}
.channel-introduce {
    margin-top: 10px;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 19px;
    text-align: justify;
    color: #777777;
}
.channel-action {
    margin-top: 16px;
    display: flex;
    justify-content: center;
}
.channel-action .btn {
    border: none;
    width: 140px;
    height: 40px;
    background: #f3f3f4;
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
    padding-left: 28px;
}
.channel-action .chat {
    margin-left: 20px;
}
.channel-action .btn::before {
    position: absolute;
    left: 28px;
    display: block;
    content: "";
    width: 24px;
    height: 24px;
    background: url("../../../assets/images/unsubscribe.svg") no-repeat center;
    background-size: cover;
}
.channel-action .subscribe.btn {
    background: #1dbb88;
    color: #fff;
}
.channel-action .btn.subscribe::before {
    background: url("../../../assets/images/subscribe.svg") no-repeat center;
    background-size: cover;
}
.channel-action .btn.chat::before {
    background: url("../../../assets/images/message-icon.svg") no-repeat center;
    background-size: cover;
}
h4 {
    margin-top: 24px;
    font-family: "PingFang SC";
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 25px;
    color: #000000;
}
.channel-article-list li {
    margin-top: 16px;
    height: 96px;
    background: #ffffff;
    box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
}
.channel-article-list li:last-child {
    margin-bottom: 16px;
}
.channel-article-list li figure {
    width: 96px;
    height: 96px;
    overflow: hidden;
}
.channel-article-list li figure img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.channel-article-list li .info {
    flex: 1;
    padding: 16px 16px 12px 12px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.channel-article-list li .info .second-line {
    font-size: 14px;
    line-height: 20px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    -webkit-line-clamp: 2;
}
.footer {
    display: flex;
    justify-content: space-between;
    font-family: "PingFang SC";
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 17px;
    text-align: center;
    color: #b3b3b3;
}
</style>
