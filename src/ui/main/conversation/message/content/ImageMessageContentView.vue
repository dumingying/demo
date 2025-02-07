<template>
    <div class="image-content-container" @click.prevent="preview">
        <img
            v-show="imageLoaded === false"
            draggable="false"
            :src="`data:image/jpeg;base64, ${message.messageContent.thumbnail}`"
        />
        <img
            v-show="imageLoaded"
            @load="onImageLoaded"
            draggable="false"
            :src="imageSrc"
        />
    </div>
</template>

<script>
import { previewImagesOrVideo } from "@/platformHelper";
import Message from "@/wfc/messages/message";
import wfc from "@/wfc/client/wfc";
import Config from "@/config";
import store from "@/store";
import { checkImFileExist } from "@/axios";
export default {
    name: "ImageMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },
    },
    data() {
        return {
            imageLoaded: false,
            conversation: store.state.conversation,
            lock: false,
        };
    },
    created() {
        // console.log(this.message, "图片");
    },
    computed: {
        imageSrc() {
            let remotePath = this.message.messageContent.remotePath;
            if (remotePath) {
                if (remotePath.startsWith("/fs/")) {
                    remotePath = `${Config.STATIC_SERVER}/im-fs${remotePath}`;
                } else if (remotePath.startsWith("fs/")) {
                    remotePath = `${Config.STATIC_SERVER}/im-fs/${remotePath}`;
                }
            }
            return remotePath;
        },
    },
    methods: {
        preview() {
            store.previewMessage(this.message, true);
            const { previewMediaItems, previewMediaIndex } = this.conversation;
            this.$nextTick(() => {
                previewImagesOrVideo(
                    {
                        images: previewMediaItems,
                        index: previewMediaIndex,
                    },
                    0
                );
            });
        },

        onImageLoaded() {
            this.imageLoaded = true;
        },
        handlerCheckImFile(item) {
            return new Promise(async (resolve, reject) => {
                // 兼容移动端的相对路径图片
                if (item.src.startsWith("/fs/")) {
                    item.src = `${Config.STATIC_SERVER}/im-fs${item.src}`;
                } else if (item.src.startsWith("fs/")) {
                    item.src = `${Config.STATIC_SERVER}/im-fs/${item.src}`;
                }
                // 云盘资源暂时不用检测
                if (
                    item.src.indexOf(Config.CLOUD_IMG_SERVER) > -1 ||
                    item.src.indexOf(Config.CLOUD_IMG_SERVER_QA) > -1
                ) {
                    resolve(item);
                } else {
                    try {
                        let res = await checkImFileExist({
                            userId: wfc.getUserId(),
                            url: item.src,
                        });
                        let { code } = res.data;
                        if (code === "000000") {
                            resolve(item);
                        } else {
                            item.src = require("../../../../../assets/images/broken-image.png");
                            resolve(item.src);
                        }
                    } catch (error) {
                        console.log(error);
                        reject(0);
                    }
                }
            });
        },
    },
};
</script>

<style lang="css" scoped>
.image-content-container {
    margin: 0 10px;
    position: relative;
    border: 1px solid #efefef;
    border-radius: 5px;
}

.image-content-container img {
    max-height: 300px;
    max-width: 300px;
    border-radius: 5px;
    overflow: hidden;
}

.right-arrow:before {
    border-left-color: white;
}

.left-arrow:before {
    border-left-color: white;
}
</style>
