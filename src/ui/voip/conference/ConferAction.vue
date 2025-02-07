<template>
    <div class="confer-action">
        <div class="header">
            <h4>{{ title }}</h4>
            <span @click="handleClose" class="close-btn">
                <Icon type="ios-close" style="font-size: 40px" />
            </span>
        </div>
        <div class="content">
            <!-- 讨论群 -->
            <div
                v-if="actionType === 1"
                class="group-content"
                @click="goGroupConversation"
            >
                <figure>
                    <img
                        @error="mixinImgUrlAlt"
                        :src="meetingDetail.imGroupPortrait"
                        draggable="false"
                    />
                </figure>
                <p>
                    <span class="new-single-line">{{
                        meetingDetail.imGroupName
                    }}</span>
                    <span>({{ meetingDetail.imGroupMemberCount }})</span>
                </p>
            </div>
            <!-- 文档   actionType => 3:有 2:无ai摘要 -->
            <div v-else class="doc-list">
                <doc-item
                    v-for="detail in docList"
                    class="doc-content"
                    :key="detail.id"
                    :docItemInfo="detail"
                    :hasAiSummary="actionType === 3"
                    :contextMenuDocInfo="contextMenuDocInfo"
                    @show-docItem-contextMenu="showDocItemContextMenu"
                ></doc-item>
                <!-- 数据为空 -->
                <EmptyList v-if="!docListLength">{{
                    $t("voip.empty")
                }}</EmptyList>
            </div>
        </div>
        <!-- 右击更多操作 -->
        <right-click-actions
            ref="menuComponents"
            v-if="actionType === 3"
            :imMeetingOwnerId="meetingDetail.imMeetingOwnerId"
            @del-doc="handlerDelDoc"
            @save-cloudDisk-action="handleSaveCloudDiskAction"
            @on-docItem-contextMenu-close="onDocItemContextMenuClose"
        ></right-click-actions>
    </div>
</template>

<script>
import DocItem from "./doc/DocItem";
import RightClickActions from "./doc/RightClickActions";
import EmptyList from "../../common/empty/EmptyList";
import localStorageEmitter from "@/ipc/localStorageEmitter";

export default {
    components: { DocItem, RightClickActions, EmptyList },
    props: {
        title: {
            type: String,
        },
        actionType: {
            type: Number,
        },
        meetingDetail: {
            type: Object,
        },
        delDoc: {
            type: Function,
        },
        saveCloudDiskAction: {
            type: Function,
        },
        updateMeetingDetail: {
            type: Function,
        },
    },
    data() {
        return {
            contextMenuDocInfo: null,
            aiLock: false,
            docList: [],
        };
    },
    created() {
        this.docList = this.meetingDetail.imMeetingAttachDtoList;
    },
    computed: {
        docListLength() {
            return (
                this.meetingDetail.imMeetingAttachDtoList &&
                this.meetingDetail.imMeetingAttachDtoList.length
            );
        },
    },
    methods: {
        // 点击进入群组聊天
        goGroupConversation() {
            if (!this.meetingDetail.isInGroup) {
                this.$Message.warning(this.$t("voip.join_from_type"));
                return;
            }
            localStorageEmitter.send(
                "conference-to-group",
                this.meetingDetail.imGroupId
            );
            this.$modal.hide("ConferAction-modal", { toGroup: true });
        },
        handleClose() {
            this.$modal.hide("ConferAction-modal");
        },
        showDocItemContextMenu(event, doc) {
            if (!this.$refs.menuComponents) {
                return;
            }
            this.contextMenuDocInfo = doc;
            this.$refs.menuComponents.$refs.menu.open(event, doc);
        },
        onDocItemContextMenuClose() {
            this.contextMenuDocInfo = null;
        },
        handlerDelDoc(docInfo) {
            this.delDoc(docInfo, "mode");
        },
        handleSaveCloudDiskAction(docInfo) {
            this.saveCloudDiskAction(docInfo);
        },
    },
};
</script>
<style lang="less" scoped>
.confer-action {
    padding: 20px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background: linear-gradient(180deg, #dafff3 0%, #ffffff 100%);
    border-radius: 12px;
    position: relative;
    display: flex;
    flex-direction: column;
    .header {
        display: flex;
        height: 40px;
        justify-content: space-between;
        align-items: center;
        box-sizing: border-box;
        h4 {
            flex: 1;
            font-style: normal;
            font-weight: 600;
            font-size: 18px;
            line-height: 26px;
            text-align: center;
            color: #253456;
        }
        .close-btn {
            width: 40px;
            position: absolute;
            right: 10px;
            top: 10px;
            font-size: 14px;
            text-align: center;
            display: inline-block;
            color: #000;
            font-weight: 600;
        }
    }

    .content {
        flex: 1;
        margin-top: 10px;
        padding: 16px;
        background: #ffffff;
        border-radius: 12px;
        overflow-y: auto;
        height: 100%;
        min-height: 74px;
        box-sizing: border-box;
        filter: drop-shadow(0px 1px 8px rgba(0, 0, 0, 0.12));
        .group-content {
            display: flex;
            align-items: center;
            figure {
                width: 40px;
                height: 40px;
                border: 1px solid rgba(0, 0, 0, 0.1);
                overflow: hidden;
                border-radius: 50%;
                img {
                    width: 100%;
                    height: 100%;
                }
            }
            p {
                flex: 1;
                font-family: "PingFang SC";
                font-style: normal;
                font-weight: 400;
                font-size: 14px;
                line-height: 20px;
                color: #000000;
                margin-left: 8px;
                display: flex;
                .new-single-line {
                    max-width: 170px;
                }
            }
        }
        .doc-list {
            .doc-content {
                border-top: 0.3px solid #f1f1f1;
                &:first-child {
                    border-top: none;
                }
            }
            .empty-doc {
                text-align: center;
                margin: 38px auto;
                padding-left: 0;
                img {
                    width: 100px;
                    height: auto;
                    margin: 0 auto;
                }
            }
        }
    }
}
</style>
