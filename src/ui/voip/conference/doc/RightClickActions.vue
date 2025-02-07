<template>
    <vue-context
        ref="menu"
        v-slot="{ data: docInfo }"
        v-on:close="onDocItemContextMenuClose"
    >
        <li>
            <a @click.prevent="openDoc(docInfo)">{{ $t("common.open") }}</a>
        </li>
        <!-- 保存链上文档  -->
        <li>
            <a @click.prevent="saveCloudDiskAction(docInfo)">
                {{ $t("common.save_cloud_disk") }}
            </a>
        </li>
        <li v-if="isShowDelDoc(docInfo)">
            <a @click.prevent="delDoc(docInfo)">{{ $t("common.delete") }}</a>
        </li>
    </vue-context>
</template>

<script>
import { downloadOtherFile } from "@/platformHelper";
import SavePathType from "@/savePathType";
import wfc from "@/wfc/client/wfc";
export default {
    props: {
        imMeetingOwnerId: {
            type: String,
            default: "",
        },
    },
    data() {
        return {};
    },
    computed: {
        isShowDelDoc() {
            return (docInfo) => {
                // 当前文件拥有者和主持人 可以删除
                return (
                    (docInfo && docInfo.ownerId === wfc.getUserId()) ||
                    this.imMeetingOwnerId === wfc.getUserId()
                );
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
        delDoc(doc) {
            this.$emit("del-doc", doc);
        },
        onDocItemContextMenuClose() {
            this.$emit("on-docItem-contextMenu-close");
        },
        saveCloudDiskAction(doc) {
            this.$emit("save-cloudDisk-action", doc);
        },
    },
};
</script>
<style lang="less" scoped>
//@import url(); 引入公共css类
</style>
