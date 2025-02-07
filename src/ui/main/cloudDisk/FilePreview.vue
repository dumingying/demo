<template>
    <div class="file-view">
        <div class="header-bar">
            <div class="header-bar-fileName">
                <span
                    v-for="(item, index) in filenameList"
                    :key="item.folderId"
                >
                    {{
                        !index
                            ? `${$t("common.mine")}${$t("common.cloud_disk")}`
                            : item.folderName
                    }}
                    <Icon type="ios-arrow-forward" />
                </span>
            </div>
            <div class="myfile-operate-title">
                <span class="return-icon" @click="close">
                    <Icon type="ios-arrow-back" />
                    {{ $t("common.back") }}
                </span>
            </div>
        </div>
        <!-- 文件展示区域 -->
        <div class="myfile-file-main-container">
            <!-- 图片 -->
            <div
                class="file-container-images images clearfix"
                v-if="fileType === 1 && imageUrl"
                v-viewer="options"
            >
                <img
                    v-for="(source, index) in images"
                    class="image previewImg"
                    style="vertical-align: middle"
                    :key="index"
                    draggable="false"
                    :src="source"
                />
            </div>

            <!-- pdf -->
            <!-- <div
        class="file-Container-pdf"
        v-else-if="[5, 7, 8, 9].includes(fileType) && pdfUrl && !loading"
      >
        <iframe style="width: 100%; height: 100%" :src="pdfUrl" frameborder="0"></iframe>
      </div> -->
            <!-- 音频 -->
            <div
                class="file-Container-mp3"
                v-else-if="fileType === 3 && audioUrl"
            >
                <aplayer class="mp3-component" :music="musicList"> </aplayer>
            </div>
            <!-- 视频 -->
            <div
                class="file-container-video"
                v-else-if="fileType === 2 && videoUrl && !loading"
            >
                <div class="video-component">
                    <video disablePictureInPicture controls>
                        <source :src="videoUrl" type="video/mp4" />
                        <source :src="videoUrl" type="video/ogg" />
                        <source :src="videoUrl" type="video/webm" />
                        <object :data="videoUrl" width="100%" height="100%">
                            <embed :src="videoUrl" width="100%" height="100%" />
                        </object>
                    </video>
                </div>
            </div>
            <div class="file-container-txt" v-else-if="txtUrl">
                <iframe
                    class="filename"
                    :src="txtUrl"
                    width="100%"
                    height="100%"
                    frameborder="1"
                ></iframe>
            </div>
            <Spin fix v-else>
                <Icon
                    type="ios-loading"
                    size="40"
                    class="demo-spin-icon-load"
                ></Icon>
                <div style="color: #1dbb88; margin-top: 10px">
                    {{ $t("disk.file_loading") }}
                </div>
            </Spin>
        </div>
    </div>
</template>

<script>
import { getFileInfo, getDownloadFileForWeb } from "@/axios";
import wfc from "@/wfc/client/wfc";
import CloudDiskHeader from "./Header";
import Aplayer from "vue3-aplayer";

import "viewerjs/dist/viewer.css";
import { directive as viewer } from "v-viewer";
export default {
    directives: {
        viewer: viewer(),
    },
    components: {
        Aplayer,
        CloudDiskHeader,
    },
    props: {
        info: {
            type: Object,
        },
    },
    data() {
        return {
            fileType: "", // 文件类型
            fileName: "", //文件名称
            videoUrl: "",
            pdfUrl: "",
            audioUrl: "",
            imageUrl: "",
            txtUrl: "",
            filenameList: [],
            loading: true,
            musicList: {
                title: this.$t("common.unknown"),
                author: this.$t("common.unknown"),
                artist: "",
                src: "",
                lrc: "[00:00.00]lrc here\n[00:01.00]aplayer",
            },
            images: [],
            options: {
                inline: false,
                button: true,
                navbar: false,
                title: false,
                toolbar: true,
                tooltip: true,
                movable: true,
                zoomable: true,
                rotatable: true,
                scalable: true,
                transition: true,
                fullscreen: false,
                keyboard: true,
                toolbar: {
                    oneToOne: true,
                    zoomIn: true,
                    zoomOut: true,
                    reset: true,
                    rotateLeft: true,
                    rotateRight: true,
                    flipHorizontal: true,
                    flipVertical: true,
                },
            },
        };
    },
    computed: {
        player() {
            return this.$refs.videoPlayer.player;
        },
    },
    created() {
        let { fileid, filetype } = this.info;
        this.fileType = filetype;
        this.getFolderList(fileid);
        this.setFileUrlValue(fileid);
    },
    methods: {
        close() {
            this.$emit("close", false);
        },
        async getFolderList(fileId) {
            try {
                const res = await getFileInfo({
                    userId: wfc.getUserId(),
                    fileId,
                });
                const { code, data, message } = res.data;
                if (code == "000000") {
                    console.log(data);
                    const { id, fileName, folderPathDtoList } = data;
                    this.fileName = fileName;
                    this.filenameList = folderPathDtoList.reverse();
                    this.filenameList.push({
                        folderId: id,
                        folderName: fileName,
                        parentFolderId: "none",
                    });
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {}
        },
        async setFileUrlValue(fileId) {
            try {
                const res = await getDownloadFileForWeb({
                    userId: wfc.getUserId(),
                    fileId,
                });
                const { code, data, message } = res.data;
                if (code === "000000") {
                    let HTTPS = this.mixinHttps;
                    switch (this.fileType) {
                        case 1:
                            this.imageUrl = `${HTTPS}/disk/previewFileByKey?downloadKey=${data}`;
                            this.images.push(this.imageUrl);
                            this.break;
                        case 2:
                            this.videoUrl = `${HTTPS}/disk/previewVideoByKey?downloadKey=${data}`;
                            console.log(this.videoUrl);
                            break;
                        case 3:
                            this.audioUrl = `${HTTPS}/disk/previewVideoByKey?downloadKey=${data}`;
                            console.log(this.audioUrl);
                            this.musicList = {
                                title:
                                    this.fileName || this.$t("common.unknown"),
                                author: this.$t("common.unknown"),
                                artist: "",
                                src: this.audioUrl,
                                url: this.audioUrl,
                                lrc: "[00:00.00]lrc here\n[00:01.00]aplayer",
                            };
                            break;
                        case 5:
                        case 7:
                        case 8:
                        case 9:
                            this.pdfUrl = `${HTTPS}/disk/previewFileByKey?downloadKey=${data}`;
                            console.log(this.pdfUrl);
                            break;
                        case 6:
                            this.txtUrl = `${HTTPS}/disk/previewFileByKey?downloadKey=${data}`;
                            console.log(this.txtUrl);
                            break;
                        default:
                            break;
                    }
                    let timer = setTimeout(() => {
                        this.loading = false;
                        timer && clearTimeout(timer);
                    }, 1200);
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {}
        },
    },
};
</script>
<style lang="less">
.file-view {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    .header-bar {
        display: flex;
        align-items: center;
        overflow: hidden;
        height: 30px;
        background: #000;
        border-radius: 6px 6px 0 0;
        .myfile-operate-title {
            display: inline-block;
            text-align: center;
            cursor: pointer;
            font-size: 14px;
            color: #fff;
            span {
                font-size: 14px;
                i {
                    margin: 0 10px;
                }
            }
            .return-icon {
                margin-left: 10px;
                margin-right: 10px;
                i {
                    font-size: 16px;
                    margin: 0;
                }
            }
        }
        .header-bar-fileName {
            flex: 15;
            display: flex;
            align-items: center;
            height: 90%;
            box-sizing: border-box;
            span {
                font-size: 12px;
                margin-left: 8px;
                color: #fff;
                cursor: pointer;
                &:first-child {
                    color: #fff;
                    font-weight: bold;
                }
                &:nth-last-child(1) {
                    /*color:#000;*/
                    i {
                        display: none;
                    }
                }
                i {
                    vertical-align: middle;
                    font-size: 12px;
                    margin-left: 3px;
                    color: #666;
                }
            }
            img {
                padding-left: 2px;
                width: 14px;
                cursor: pointer;
            }
        }
    }
    .myfile-file-main-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        position: relative;
        background-color: rgba(42, 43, 51, 0.61);
        border-radius: 0 0 6px 6px;
        overflow: auto;
        .file-container-images,
        .file-container-video {
            height: 100%;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            .previewImg {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            }
            .video-component {
                max-width: 790px;
                max-height: 460px;
                object-fit: contain;
                overflow: hidden;
                display: flex;
                align-content: center;
                video {
                    max-width: 790px;
                    max-height: 460px;
                }
            }
        }
        .file-Container-pdf {
            height: 100%;
        }
        .file-Container-mp3 {
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            .mp3-component {
                width: 70%;
                height: 66px;
                .aplayer-author {
                    display: none;
                }
            }
        }
        .file-container-txt {
            background-color: whitesmoke;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 94%;
            height: 94%;
            margin: 3% auto;

            .filename {
                min-height: 100%;
            }
        }
        .droptext {
            position: absolute;
            top: 0;
            bottom: 0;
            right: 0;
            left: 0;
            margin: auto;
            height: 1rem;
            width: 18rem;
        }
    }
}
.demo-spin-icon-load {
    animation: ani-demo-spin 1s linear infinite;
    color: #1dbb88;
}
@keyframes ani-demo-spin {
    from {
        transform: rotate(0deg);
    }
    50% {
        transform: rotate(180deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
<style>
.vjs-icon-fullscreen-enter:before,
.video-js .vjs-fullscreen-control .vjs-icon-placeholder:before {
    content: "\F108";
    color: white;
}
.vjs-icon-pause:before,
.video-js .vjs-play-control.vjs-playing .vjs-icon-placeholder:before {
    content: "\F103";
    color: white;
}
.vjs-icon-volume-high:before,
.video-js .vjs-mute-control .vjs-icon-placeholder:before {
    content: "\F107";
    color: white;
}
</style>
