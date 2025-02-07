<!-- 会议详情中 文档列表  item 内容组件 -->
<template>
    <div
        :class="['doc-item-wrap', { active: activeDoc(docItemInfo) }]"
        @contextmenu.prevent="showDocItemContextMenu($event, docItemInfo)"
    >
        <img
            @click="openDoc(docItemInfo)"
            :src="docItemInfo.iconURL"
            class="file-icon"
            draggable="false"
        />
        <div class="doc-item">
            <div class="doc-info">
                <p @click="openDoc(docItemInfo)" class="info">
                    <strong class="doc-name new-single-line">
                        {{ docItemInfo.attachName }}
                    </strong>
                    <span>
                        {{ $t("voip.creator") }}:
                        {{
                            mixinResetPhoneNumber(docItemInfo.ownerDisplayName)
                        }}
                    </span>
                </p>
                <!-- ai摘要 按钮 -->
                <span
                    class="ai-icon"
                    v-if="docItemInfo.isSupportAiSummary && hasAiSummary"
                    @click="handlerAi(docItemInfo)"
                >
                    <img :src="aiIconSrc(docItemInfo)" />
                </span>
            </div>
            <!-- ai摘要内容  -->
            <div
                :class="['ai-summary', docItemInfo.loading ? 'no-bottom' : '']"
                v-if="docItemInfo.summary || docItemInfo.loading"
            >
                <p
                    :class="[
                        'summary-text',
                        !docItemInfo.showAll ? 'second-line' : '',
                    ]"
                >
                    {{ $t("voip.ai") }}:
                    {{ docItemInfo.loading ? "......" : docItemInfo.summary }}
                </p>
                <span
                    v-if="
                        docItemInfo.summary &&
                        docItemInfo.summary.length > 50 &&
                        !docItemInfo.loading
                    "
                    :class="['up-down', docItemInfo.showAll ? 'down' : '']"
                    @click="handleShowAll(docItemInfo)"
                >
                    {{
                        docItemInfo.showAll
                            ? $t("web3.collapse")
                            : $t("web3.expand")
                    }}
                    <Icon type="ios-arrow-forward" class="up-icon-btn" />
                </span>
            </div>
        </div>
    </div>
</template>

<script>
import { downloadOtherFile } from "@/platformHelper";
import SavePathType from "@/savePathType";
import { getAiSummary } from "@/axios";
import wfc from "@/wfc/client/wfc";
export default {
    props: {
        docItemInfo: {
            type: Object,
            default: {},
        },
        hasAiSummary: {
            type: Boolean,
            default: true,
        },
        contextMenuDocInfo: {
            type: Object,
            default: {},
        },
    },
    name: "DocItem",
    data() {
        return {
            aiLock: false,
        };
    },
    computed: {
        currentLanguage() {
            return this.$store.state.currentLanguage;
        },
        aiIconSrc() {
            return (detail) => {
                let src1 =
                    this.currentLanguage === "en"
                        ? require("../../../../assets/images/ai-start-en.png")
                        : require("../../../../assets/images/ai-start-zh.png");
                let src2 =
                    this.currentLanguage === "en"
                        ? require("../../../../assets/images/ai-refresh-en.png")
                        : require("../../../../assets/images/ai-refresh-zh.png");
                return detail.refresh ? src2 : src1;
            };
        },
        activeDoc() {
            return (doc) => {
                if (!this.contextMenuDocInfo) return false;
                return doc.id === this.contextMenuDocInfo.id;
            };
        },
    },
    methods: {
        // 打开文件
        openDoc(docInfo) {
            try {
                let { attachCid, attachName } = docInfo;
                downloadOtherFile(
                    {
                        fileName: attachName,
                        url: `${
                            this.mixinHttps
                        }/disk/downloadMeetingFile?userId=${wfc.getUserId()}&cid=${attachCid}&fileName=${attachName}`,
                    },
                    true, // 仅打开
                    SavePathType.Meeting // 保存路径
                );
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("voip.open_failed"));
            }
        },
        showDocItemContextMenu(event, doc) {
            this.$emit("show-docItem-contextMenu", event, doc);
        },

        // 点击文档摘要或刷新
        async handlerAi(doc) {
            if (this.aiLock) return;
            this.aiLock = true;
            this.docItemInfo.loading = true;
            try {
                let res = await getAiSummary({
                    cid: doc.attachCid,
                    fileName: doc.attachName,
                });
                this.aiLock = false;
                const { code, message, data } = res.data;
                if (code === "000000") {
                    this.docItemInfo.summary = data.answer;
                    this.docItemInfo.refresh = 1;
                    this.docItemInfo.loading = false;
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.aiLock = false;
                console.log(error);
            }
        },
        handleShowAll(doc) {
            this.docItemInfo.showAll = !doc.showAll;
        },
    },
};
</script>
<style lang="less" scoped>
.doc-item-wrap {
    display: flex;
    box-sizing: border-box;
    padding: 8px 0;
    &.active {
        background: #eceef4;
    }
    .file-icon {
        width: 40px;
        height: 40px;
        margin-right: 8px;
    }
    .doc-item {
        flex: 1;
        .doc-info {
            display: flex;
            align-items: center;
            .info {
                flex: 1;
                font-family: "PingFang SC";
                font-style: normal;
                font-weight: 400;
                font-size: 12px;
                line-height: 18px;
                color: #999999;
                .doc-name {
                    font-weight: 500;
                    font-size: 14px;
                    line-height: 20px;
                    color: #000000;
                    margin-bottom: 3px;
                }
            }
        }
        .ai-icon {
            height: 30px;
            text-align: right;
            img {
                width: auto;
                height: 100%;
            }
        }
        .ai-summary {
            display: flex;
            flex-wrap: wrap;
            margin-top: 10px;
            background: rgba(108, 114, 226, 0.08);
            padding: 8px 8px 30px;
            border-radius: 5px;
            overflow: hidden;
            color: rgba(51, 51, 51, 1);
            font-family: PingFang SC;
            font-size: 12px;
            font-weight: 500;
            line-height: 18px;
            position: relative;
            .summary-text {
                position: relative;
                line-height: 18px;
                &.second-line {
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    -webkit-line-clamp: 2;
                }
            }
            &.no-bottom {
                padding: 8px;
            }
            .up-down {
                bottom: 8px;
                right: 8px;
                position: absolute;
                color: rgba(102, 102, 102, 1);
                .up-icon-btn {
                    transform: rotate(90deg);
                }
                &.down {
                    .up-icon-btn {
                        transform: rotate(-90deg);
                    }
                }
            }
        }
    }
}
</style>
