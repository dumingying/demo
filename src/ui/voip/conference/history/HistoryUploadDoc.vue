<template>
    <div class="global-uploader" ref="globalUploader">
        <!-- 上传 -->
        <uploader
            ref="uploader"
            class="uploader-app"
            :options="getOptions()"
            :autoStart="false"
            :file-status-text="fileStatusText"
            @file-added="onFileAdded"
            @file-success="onFileSuccess"
            @file-error="onFileError"
            @file-removed="onFileRemoved"
        >
        </uploader>
    </div>
</template>
<script>
import TextMessageContent from "@/wfc/messages/textMessageContent";
import ConversationType from "@/wfc/model/conversationType";
import Conversation from "@/wfc/model/conversation";

import { tipsContent } from "@/ui/common/Tips";
import { ipcRenderer, dialog } from "@/platform";

import SparkMD5 from "spark-md5";
import wfc from "@/wfc/client/wfc";

import {
    getCheckUploadEnvironment,
    getStopUpload,
    getPostUpload,
} from "@/axios";
import {
    imageThumbnail,
    videoDuration,
    videoThumbnail,
} from "@/ui/util/imageUtil";
import { generateFileID } from "@/ui/util/idGenerate";

export default {
    data: function () {
        return {
            chunkSize: 10485760,
            uploadFromPage: "", // 上传文档页面来源 ，区分共享屏幕时上传文档，处理提示框显示
            bindingGroupId: "", // 是否绑定了群组
            fileStatusText: {
                success: this.$t("common.uploaded_success"),
                error: this.$t("common.uploaded_error"),
                uploading: this.$t("common.uploading"),
                paused: this.$t("common.paused"),
                waiting: this.$t("common.waiting"),
            },
            params: {
                userId: "",
                meetingId: "",
                parentFolderId: "",
                cycleMeetingId: "",
            },
        };
    },
    mounted() {
        this.$eventBus.$on("historyUploadDoc", (file) => {
            //   console.log(file, "上传文档信息");
            if (this.$refs["uploader"]) {
                let uploader = this.$refs["uploader"].uploader;
                let fileArray = [];
                const {
                    fromPage,
                    bindingGroupId,
                    userId,
                    cycleMeetingId,
                    meetingId,
                    files,
                } = file;
                this.uploadFromPage = fromPage; // 页面来源
                this.bindingGroupId = bindingGroupId;
                this.params.userId = userId;
                this.params.cycleMeetingId = cycleMeetingId || "";
                this.params.meetingId = meetingId || "";
                for (let i = 0; i < files.length; i++) {
                    fileArray.push(files[i]);
                }
                fileArray.forEach((dropFile) => {
                    if (dropFile.type) {
                        // 如果type不是空串，一定是文件
                        uploader.addFile(dropFile);
                    } else {
                        try {
                            let fileReader = new FileReader();
                            fileReader.readAsDataURL(dropFile.slice(0, 3));
                            fileReader.addEventListener(
                                "load",
                                function (e) {
                                    console.log(e, "load");
                                    uploader.addFile(dropFile);
                                },
                                false
                            );

                            fileReader.addEventListener(
                                "error",
                                function (e) {
                                    console.log(e, "error，不可以上传文件夹");
                                },
                                false
                            );
                        } catch (e) {
                            console.log(e, "catch");
                        }
                    }
                });
            }
        });
    },
    methods: {
        getOptions() {
            return {
                target: `${this.mixinHttps}/disk/uploadChunk`,
                chunkSize: this.chunkSize, // 10 mb
                fileParameterName: "file",
                maxChunkRetries: 3,
                testChunks: false,
                processParams(params, { name, parentId, fileId }) {
                    return {
                        ...params,
                        fileName: name,
                        parentId,
                        fileId,
                    };
                },
                query: (file) => {
                    const { userId, cycleMeetingId, meetingId } = this.params;
                    return {
                        repeType: "default",
                        userId,
                        meetingId,
                        cycleMeetingId,
                        fileMD5: file.uniqueIdentifier,
                    };
                },
            };
        },
        // 添加到下载列表
        onFileAdded(file) {
            file.parentId = this.params.parentFolderId;
            file.fileId = generateFileID();
            this.computeMD5(file);
        },
        /**
         * 计算md5，实现断点续传及秒传
         * @param file
         */
        computeMD5(file) {
            //   file.pause();
            let fileReader = new FileReader();
            let blobSlice =
                File.prototype.slice ||
                File.prototype.mozSlice ||
                File.prototype.webkitSlice;
            let currentChunk = 0;
            let chunks = Math.ceil(file.size / this.chunkSize);
            let spark = new SparkMD5.ArrayBuffer();
            this.loadNext(blobSlice, currentChunk, file, fileReader);
            fileReader.onload = (e) => {
                spark.append(e.target.result);
                if (currentChunk < chunks) {
                    currentChunk++;
                    this.loadNext(blobSlice, currentChunk, file, fileReader);
                } else {
                    file.uniqueIdentifier = spark.end();
                    this.computeMD5Success(file);
                }
            };
            fileReader.onerror = function () {
                this.error(this.$t("disk.read_error", [file.name]));
                file.cancel();
            };
        },
        loadNext(blobSlice, currentChunk, file, fileReader) {
            let start = currentChunk * this.chunkSize;
            let end =
                start + this.chunkSize >= file.size
                    ? file.size
                    : start + this.chunkSize;
            fileReader.readAsArrayBuffer(blobSlice.call(file.file, start, end));
        },
        async computeMD5Success(file) {
            const { fileId, size: totalSize } = file;
            const { userId, cycleMeetingId, meetingId } = this.params;
            try {
                // 上传文件前置检查
                const res = await getCheckUploadEnvironment({
                    userId,
                    fileId,
                    totalSize,
                    cycleMeetingId,
                    meetingId,
                });
                const { code, message, data } = res.data;
                if (code == "000000") {
                    this.params.parentFolderId = data;
                    file.parentId = data;
                    file.resume();
                    // 已绑定了群组需要发送消息
                    if (this.bindingGroupId) {
                        this.sendTextMessageContent(file.name);
                    }
                } else {
                    file.cancel();
                    if (code === "1400014") {
                        // 会议共享屏幕上传文档
                        if (this.uploadFromPage === "screenShare") {
                            dialog
                                .showMessageBox({
                                    type: "info",
                                    buttons: [
                                        this.$t("common.upgrade"),
                                        this.$t("common.cancel"),
                                    ],
                                    message: this.$t("disk.upload_fail_upper"),
                                })
                                .then((obj) => {
                                    if (!obj.response) {
                                        ipcRenderer.send(
                                            "message-history-openUrl",
                                            {
                                                urlAddress:
                                                    "https://cloud.tongfudun.com/#/user/homeDetail?productId=38",
                                            }
                                        );
                                    }
                                });
                        } else {
                            this.$alert({
                                isMainWindow:
                                    this.uploadFromPage !== "conference",
                                content: tipsContent[4],
                                cancelText: "",
                            });
                        }
                    } else {
                        this.$Message.error(message);
                    }
                }
            } catch (error) {
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        //  上传成功后发送 上传文件消息
        sendTextMessageContent(fileName) {
            let textMessageContent = new TextMessageContent();
            textMessageContent &&
                (textMessageContent.content = this.$t(
                    "voip.upload_file_check",
                    [fileName]
                ));
            let conversation = new Conversation(
                ConversationType.Group,
                this.bindingGroupId,
                0
            );
            wfc.sendConversationMessage(conversation, textMessageContent);
        },
        // 分片上传成功
        async onFileSuccess(rootFile, file, response, chunk) {
            try {
                const res = JSON.parse(response);
                // 服务器自定义的错误（即虽返回200，但是是错误的情况），这种错误是Uploader无法拦截的
                if (res.code !== "000000") {
                    this.$Message.error(res.message);
                    return;
                }
                //上传缩率图
                const type = file.getType();
                if (
                    this.mixinIsImageExt(type) ||
                    (this.mixinIsVideoExt(type) &&
                        !(file.fileType.indexOf("audio") > -1))
                ) {
                    let thumbnailFile, duration;
                    let filename =
                        file.name.substring(0, file.name.lastIndexOf(".") + 1) +
                        "jpeg";
                    //图片和视频文件
                    if (this.mixinIsImageExt(type)) {
                        let imgBase64_image = await imageThumbnail(file.file);
                        if (imgBase64_image) {
                            thumbnailFile = this.mixinBase64toFile(
                                imgBase64_image,
                                filename
                            );
                        }
                    } else {
                        duration = Math.ceil(
                            (await videoDuration(file.file)) * 1000
                        );
                        let imgBase64_video = await videoThumbnail(file.file);
                        if (imgBase64_video) {
                            thumbnailFile = this.mixinBase64toFile(
                                imgBase64_video,
                                filename
                            );
                        }
                    }

                    this.$nextTick(async () => {
                        try {
                            let formData = new FormData();
                            formData.append("shotcut", thumbnailFile);
                            formData.append("nodeId", file.fileId);
                            formData.append("filename", filename);
                            formData.append("videoTime", duration);
                            formData.append(
                                "cycleMeetingId",
                                this.params.cycleMeetingId
                            );
                            formData.append("meetingId", this.params.meetingId);
                            let res = await getPostUpload(formData);
                            const { code, message } = res.data;
                            if (code === "000000") {
                                this.params.fileId = file.fileId;
                                this.$eventBus.$emit(
                                    "historyMeetingUploadSuccess",
                                    this.params
                                );
                            } else {
                                console.log(message);
                            }
                        } catch (error) {
                            console.error("Error:", error);
                        }
                    });
                } else {
                    this.params.fileId = file.fileId;
                    this.$eventBus.$emit(
                        "historyMeetingUploadSuccess",
                        this.params
                    );
                }
            } catch (error) {}
        },
        // 停止上传
        async onFileRemoved(file) {
            try {
                await getStopUpload({
                    userId: this.params.userId,
                    fileId: file.fileId,
                });
            } catch (error) {
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // eslint-disable-next-line no-unused-vars
        onFileError() {
            this.$Message.error(this.$t("disk.upload_fail_later"));
        },
    },
    beforeUnmount() {
        this.$eventBus.$off("historyUploadDoc");
    },
};
</script>

<style scoped lang="less">
.global-uploader {
    display: none;
}
</style>
