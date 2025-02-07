<template>
    <div class="report-poster-wrap">
        <span @click="close" class="close-btn">
            <Icon type="ios-close" style="font-size: 40px" />
        </span>
        <div class="report-poster">
            <div class="poster-image" v-if="posterImage">
                <img :src="posterImage" draggable="false" />
            </div>
            <div class="poster" v-else ref="poster">
                <div class="content">
                    <div class="user-info">
                        <figure>
                            <img :src="userPortrait" alt="" draggable="false" />
                        </figure>
                        <p class="new-single-line">{{ userName }}</p>
                    </div>
                    <div class="date">
                        <template v-if="currentLanguage !== 'en'">
                            {{ $t("message.year", [messageContent.year]) }}
                        </template>
                        <span v-if="messageContent.reportType === 1">
                            {{
                                $t("message.week", [messageContent.weekInYear])
                            }}
                        </span>
                        <span v-if="messageContent.reportType === 2">
                            {{
                                $t("message.month", [
                                    currentLanguage === "en"
                                        ? $t(
                                              `common.month_${messageContent.monthOfYear}`
                                          )
                                        : messageContent.monthOfYear,
                                ])
                            }}
                        </span>
                        <template v-if="currentLanguage === 'en'">
                            {{ $t("message.year", [messageContent.year]) }}
                        </template>
                        {{ messageContent.startTime }} -
                        {{ messageContent.endTime }}
                    </div>
                    <div class="meeting" v-if="messageContent.joinCount">
                        <strong class="title">
                            {{
                                currentLanguage === "en"
                                    ? messageContent.titleEn
                                    : messageContent.title
                            }}
                        </strong>
                        <p class="text">
                            {{
                                currentLanguage === "en"
                                    ? messageContent.contentEn
                                    : messageContent.content
                            }}
                        </p>
                        <p class="start-text">
                            <i18n-t keypath="message.attend_meeting">
                                <template v-slot:action>
                                    <em>{{ messageContent.joinCount }}</em>
                                </template>
                            </i18n-t>
                            <span v-if="messageContent.reportType === 2">
                                <i18n-t keypath="message.month_total_time">
                                    <template v-slot:action>
                                        <em>{{ messageContent.joinTime }}</em>
                                    </template>
                                </i18n-t>
                            </span>
                        </p>
                        <template v-if="messageContent.reportType === 1">
                            <p>
                                <i18n-t keypath="message.week_total_time">
                                    <template v-slot:action>
                                        <em>{{ messageContent.joinTime }}</em>
                                    </template>
                                </i18n-t>
                            </p>
                            <p>
                                <template
                                    v-if="
                                        messageContent.createCycleMeetingCount
                                    "
                                >
                                    <i18n-t keypath="message.periodic_meeting">
                                        <template v-slot:action>
                                            <em>{{
                                                messageContent.createCycleMeetingCount
                                            }}</em>
                                        </template>
                                    </i18n-t>
                                </template>
                                <template
                                    v-if="
                                        messageContent.createReserveMeetingCount
                                    "
                                >
                                    <i18n-t keypath="message.book_meeting">
                                        <template v-slot:action>
                                            <em>{{
                                                messageContent.createReserveMeetingCount
                                            }}</em>
                                        </template>
                                    </i18n-t>
                                </template>
                            </p>
                        </template>
                        <template v-if="messageContent.reportType === 2">
                            <p>
                                <i18n-t keypath="message.maximum_meeting">
                                    <template v-slot:action>
                                        <em>{{
                                            messageContent.maxMeetingTime
                                        }}</em>
                                    </template>
                                </i18n-t>
                            </p>
                            <p class="no-left">
                                <i18n-t keypath="message.busy_day">
                                    <template v-slot:action>
                                        <em>{{ busyDay }}</em>
                                    </template>
                                    <template v-slot:count>
                                        <em>{{
                                            messageContent.maxMeetingCount
                                        }}</em>
                                    </template>
                                </i18n-t>
                            </p>
                        </template>
                    </div>
                    <div class="meeting" v-else>
                        <strong class="title">{{
                            $t("message.mystery")
                        }}</strong>
                        <p class="text">{{ $t("message.come_on") }}</p>
                        <p class="text">{{ $t("message.catch_you") }}</p>
                        <p class="start-text">
                            {{ $t("message.currently_no", [emptyStr]) }}
                        </p>
                        <p>{{ $t("message.more_chainpal") }}</p>
                        <p>{{ $t("message.own_meeting", [emptyStr]) }}</p>
                    </div>
                    <div class="qr">
                        <p>{{ $t("message.scan_code") }}</p>
                        <figure>
                            <img
                                src="../../../../../assets/images/chainpal-qr.png"
                                alt=""
                                draggable="false"
                            />
                        </figure>
                    </div>
                </div>
            </div>
            <div class="footer">
                <span class="share" @click="handler(0)">
                    {{ $t("common.share") }}
                </span>
                <span class="download" @click="handler(1)">
                    {{ $t("common.save_download") }}
                </span>
            </div>
        </div>
    </div>
</template>

<script>
import { getItem } from "@/ui/util/storageHelper";
import { imageThumbnail } from "@/ui/util/imageUtil";
import { downloadOtherFile } from "@/platformHelper";
import { generateUUID } from "@/ui/util/idGenerate";

import Message from "@/wfc/messages/message";
import ImageMessageContent from "@/wfc/messages/imageMessageContent";
import MessageContentMediaType from "@/wfc/messages/messageContentMediaType";
import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";

import html2canvas from "html2canvas";
import store from "@/store";
import wfc from "@/wfc/client/wfc";
import nodePath from "path";
import Config from "@/config";
import tmp from "tmp";
import dayjs from "dayjs";
export default {
    name: "ReportPoster",
    props: {
        message: {
            type: Message,
            required: true,
        },
    },
    data() {
        return {
            sharedPickState: store.state.pick,
            userPortrait: "",
            posterImage: "",
            lock: false,
        };
    },
    computed: {
        currentLanguage() {
            return this.$store.state.currentLanguage;
        },
        messageContent() {
            return this.message.messageContent.content;
        },
        busyDay() {
            return dayjs(this.messageContent.mostBusyDate).format("MM.DD");
        },
        userName() {
            let name = getItem("userName");
            if (/^1[3|4|5|7|8|9][0-9]{9}$/.test(name)) {
                return this.mixinResetPhoneNumber(name);
            }
            return name;
        },
        emptyStr() {
            return this.messageContent.reportType === 1
                ? this.$t("message.week_summary")
                : this.$t("message.monthly_summary");
        },
    },
    created() {
        this.userPortrait = getItem("userPortrait");
    },
    mounted() {
        this.initCapture();
    },
    methods: {
        initCapture() {
            let poster = this.$refs.poster;
            // 获取内容宽度高
            const width = poster.offsetWidth;
            const height = poster.offsetHeight;
            const canvas2 = document.createElement("canvas");
            // 将canvas画布放大若干倍，然后盛放在较小的容器内，就显得不模糊了
            canvas2.width = width * 2;
            canvas2.height = height * 2;
            // 设定 canvas css宽高为 DOM 节点宽高
            canvas2.style.width = `${width}px`;
            canvas2.style.height = `${height}px`;
            // 获取画笔
            const context = canvas2.getContext("2d");
            // 将所有绘制内容放大像素比倍
            context.scale(1, 1);
            // 【重要】关闭抗锯齿
            context.mozImageSmoothingEnabled = false;
            context.webkitImageSmoothingEnabled = false;
            context.msImageSmoothingEnabled = false;
            context.imageSmoothingEnabled = false;
            const opts = {
                backgroundColor: null,
                scale: 2, // 添加的scale 参数
                canvas: canvas2,
                width,
                height,
                logging: true, // 日志开关，便于查看html2canvas的内部执行流程
                useCORS: true, // canvas 图片跨域
                allowTaint: false,
            };
            try {
                html2canvas(poster, opts)
                    .then((canvas) => {
                        let imgData = canvas.toDataURL("image/png", 0.8);
                        this.posterImage = imgData;
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            } catch (error) {}
        },
        handler(type) {
            if (this.lock) return;
            this.lock = true;
            const { posterUrl } = this.message.messageContent;
            if (posterUrl) {
                this.posterImage = posterUrl;
                if (type) {
                    downloadOtherFile(
                        {
                            fileName: nodePath.basename(this.posterImage),
                            url: this.posterImage,
                        },
                        false // 仅下载
                    );
                } else {
                    this.getImageMessageContent(posterUrl); // 分享
                }
                this.lock = false;
            } else {
                let filename = tmp.tmpNameSync() + ".png";
                wfc.uploadMedia(
                    filename,
                    this.posterImage,
                    MessageContentMediaType.Image,
                    (url) => {
                        this.$set(
                            this.message.messageContent,
                            "posterUrl",
                            url
                        );
                        if (type) {
                            downloadOtherFile(
                                {
                                    fileName: nodePath.basename(url),
                                    url,
                                },
                                false // 仅下载
                            );
                            this.lock = false;
                        } else {
                            this.getImageMessageContent(url); // 分享
                        }
                    },
                    (error) => {
                        console.log(error);
                        this.lock = false;
                        this.$Message.error(this.$t("common.error_later"));
                    }
                );
            }
        },
        // 生成图片消息体并唤起分享弹窗
        async getImageMessageContent(remotePath) {
            try {
                let size = await store.getUrlImageInfo(remotePath); // 获取图片内存大小
                let fileName = remotePath.substring(
                    remotePath.lastIndexOf("/") + 1
                );
                let file = {
                    path: remotePath,
                    name: fileName,
                    size,
                };
                let iThumbnail = await imageThumbnail(file);
                iThumbnail = iThumbnail || Config.DEFAULT_THUMBNAIL_URL;
                let message = new Message();
                let messageContent = new ImageMessageContent(
                    null,
                    remotePath,
                    iThumbnail.split(",")[1]
                );
                let imFileId = generateUUID();
                messageContent.imFileId = imFileId;
                messageContent.imFileName = file.name;
                messageContent.imFileSize = file.size;
                messageContent.remotePath = remotePath;
                message.messageContent = messageContent;
                // 唤起邀请弹窗
                this.sharedPickState.conversations.length = 0;
                this.lock = false;
                this.$forwardMessage({
                    forwardType: ForwardType.NORMAL,
                    messages: [message],
                    forwardFilterAnonymous: true,
                }).then((data) => {
                    if (data !== "cancel") {
                        this.$Message.success(this.$t("friend_request.sent"));
                    }
                });
            } catch (error) {
                this.lock = false;
            }
        },
        close() {
            this.$modal.hide("reportPoster-modal");
        },
    },
};
</script>

<style lang="less" scoped>
.report-poster-wrap {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
}
.close-btn {
    width: 70px;
    font-size: 14px;
    text-align: right;
    display: inline-block;
    position: absolute;
    right: 10px;
    top: 10px;
}
.report-poster {
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    background: #b8f3f5;

    .poster {
        width: 100%;
        height: 640px;
        padding: 48px 24px;
        background: #b8f3f5 url(../../../../../assets/images/poster-bg.png)
            no-repeat top center;
        background-size: 100% auto;
        display: flex;
        flex-direction: column;
        .content {
            flex: 1;
            padding: 12px;
            border-radius: 44px;
            box-shadow: 0px 2px 12px 2px rgba(0, 0, 0, 0.04);
            background: url(../../../../../assets/images/poster-title-bg.png)
                    no-repeat right top,
                url(../../../../../assets/images/poster-card-bg.png) no-repeat
                    center 146px #fff;
            background-size: 155px auto, 316px auto;
            .user-info {
                display: flex;
                align-items: center;
                margin-top: 20px;
                figure {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    margin: 0 12px;
                    overflow: hidden;
                    img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                    }
                }
                p {
                    flex: 1;
                    color: #333;
                    text-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.08);
                    font-family: PingFang SC;
                    font-size: 20px;
                    font-style: normal;
                    font-weight: 500;
                    line-height: 22px;
                }
            }
            .date {
                display: inline-block;
                margin: 16px 12px;
                border-radius: 20px;
                padding: 8px 20px;
                background: #18bde1;
                color: #fff;
                font-family: PingFang SC;
                font-size: 13px;
                font-style: normal;
                font-weight: 500;
                line-height: normal;
            }
            .meeting {
                height: 350px;
                box-sizing: border-box;
                overflow: hidden;
                padding: 60px 30px 0;
                color: #0987a3;
                font-family: PingFang SC;
                font-size: 14px;
                font-style: normal;
                font-weight: 500;
                line-height: 24px;
                p {
                    margin-top: 6px;
                }

                .title {
                    color: #001c22;
                    font-family: PingFang SC;
                    font-size: 32px;
                    font-style: normal;
                    font-weight: 500;
                    line-height: normal;
                }
                p.start-text {
                    margin-top: 20px;
                }
                p.text {
                    color: #0987a3;
                    font-family: PingFang SC;
                    font-size: 13px;
                    font-style: normal;
                    font-weight: 400;
                    line-height: normal;
                }
                em {
                    color: #000e11;
                    font-family: PingFang SC;
                    font-size: 16px;
                    font-style: normal;
                    font-weight: 500;
                    line-height: 24px;
                    padding: 0 3px;
                }
            }
            .qr {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                p {
                    color: #000;
                    font-family: PingFang SC;
                    font-size: 12px;
                    font-style: normal;
                    font-weight: 400;
                    line-height: normal;
                    margin-right: 5px;
                }
                figure {
                    margin-right: 18px;
                    width: 48px;
                    height: 48px;
                    img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                    }
                }
            }
        }
    }
    .poster-image {
        width: 100%;
        height: 640px;
        img {
            width: 100%;
            height: auto;
        }
    }
    .footer {
        width: 100%;
        text-align: center;
        padding: 20px;

        span {
            width: 40px;
            height: 40px;
            display: inline-block;
            margin: 0 50px;
            padding-top: 42px;
            color: #000;
            font-family: PingFang SC;
            font-size: 12px;
            font-style: normal;
            font-weight: 500;
        }
        .share {
            background: url(../../../../../assets/images/poster-share.png)
                no-repeat top center;
            background-size: 40px;
        }
        .download {
            background: url(../../../../../assets/images/poster-download.png)
                no-repeat top center;
            background-size: 40px;
        }
    }
}
</style>
