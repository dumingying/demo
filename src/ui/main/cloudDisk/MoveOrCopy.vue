<template>
    <div class="moveOrCopy-container">
        <div class="moveOrCopy-title">
            <span>{{ title }}</span>
        </div>
        <div class="moveOrCopy-filecontent">
            <tree-item :datalist="userData" :saveID="saveID"></tree-item>
        </div>
        <div class="moveOrCopy-confirm">
            <button @click="close('newFolder')" class="btn create">
                {{ $t("disk.new_folder") }}
            </button>
            <div class="btn-wrap">
                <button @click="close('close')" class="btn cancel">
                    {{ $t("common.cancel") }}
                </button>
                <button @click="close('save')" class="btn confirm">
                    {{ $t("common.confirm") }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { getCloudAllFolders, getNewFolder } from "@/axios";

import treeItem from "./TreeItem";
import newOrRename from "./NewOrRename";

import wfc from "@/wfc/client/wfc";

export default {
    props: ["title", "select-data"],
    components: {
        treeItem,
    },
    data() {
        return {
            publicPath: process.env.BASE_URL,
            userData: [],
            saveID: "",
            openNewDialog: false,
        };
    },
    mounted() {
        this.$eventBus.$on("getIdItem", (id) => {
            this.saveID = id;
        });
        this.getAllFolders("init");
    },
    methods: {
        close(prop) {
            if (prop === "close") {
                this.$modal.hide("moveOrCopy-modal");
                return;
            }
            if (!this.saveID) {
                this.$Message.error(this.$t("disk.save_path"));
                return;
            }
            if (prop == "newFolder") {
                this.$modal.show(
                    newOrRename,
                    {
                        title: this.$t("disk.new_folder"),
                        iconfont: require("@/assets/images/folder.png"),
                        filename: "",
                    },
                    null,
                    {
                        name: "newOrRename-modal",
                        width: 380,
                        height: 200,
                    },
                    {
                        "before-close": (event) => {
                            if (event.params) {
                                this.closeNew(event.params.filePackage);
                            }
                        },
                    }
                );
                return;
            }
            if (prop == "save") {
                this.$modal.hide("moveOrCopy-modal", { id: this.saveID });
            }
        },
        //新建对话框下的按钮触发
        closeNew(filename) {
            getNewFolder({
                parentId: this.saveID,
                folderName: filename || "",
            })
                .then((response) => {
                    const { code, message } = response.data;
                    if (code == "000000") {
                        this.getAllFolders();
                    } else {
                        let messageText = {
                            1400002: this.$t("disk.has_folder_name"),
                            1400003: this.$t("disk.invalid_folder_name"),
                        };
                        this.$Message.error(messageText[code] || message);
                    }
                })
                .catch((error) => console.log(error));
        },
        //新建文件夹请求
        async getAllFolders(type) {
            try {
                let res = await getCloudAllFolders({});
                const { code, message, data } = res.data;
                if (code == "000000") {
                    this.userData = [];
                    this.userData.push(JSON.parse(JSON.stringify(data)));
                    this.userData[0].folderDto.folderName =
                        this.$t("disk.all_file");
                    if (type) {
                        this.saveID = this.userData[0].folderDto.id;
                        this.userData[0]._isOpen = true;
                    }
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.$Message.error(this.$t("common.error_later"));
            }
        },
    },
    beforeUnmount() {
        this.$eventBus.$off("getIdItem");
    },
};
</script>

<style lang="less" scoped>
.moveOrCopy-container {
    border-radius: 10px;
    padding: 20px;
    font-size: 14px;
    box-sizing: border-box;
    .moveOrCopy-title {
        height: 40px;
        line-height: 40px;
        text-align: center;
        font-size: 16px;
        font-weight: 600;
        position: relative;
    }
    .moveOrCopy-filecontent {
        height: 270px;
        margin: 0 auto;
        overflow: auto;
        background-color: #f2f2f2;
        padding: 10px;
        box-sizing: border-box;
        border-radius: 10px;
    }
    .moveOrCopy-confirm {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        font-size: 14px;
        .confirm {
            background-color: #1dbb88;
            border-radius: 4px;
            color: #fff;
            margin-left: 20px;
            border: none;
        }
        button {
            height: 30px;
            background-color: #ffffff;
            border-radius: 4px;
            border: solid 1px rgba(151, 151, 151, 0.3);
            font-size: 14px;
            padding: 3px 20px;
            cursor: pointer;
            &:focus {
                outline: 0;
            }
        }
    }
}
</style>
