<template>
    <div class="newOrRename-wrap">
        <div class="newOrRename-title">
            <span>{{ title }}</span>
        </div>
        <div class="newOrRename-content">
            <img :src="iconfont" draggable="false" />
            <input
                type="text"
                :placeholder="$t('disk.edit_folder_name')"
                v-model="filePackage"
                maxlength="30"
                @input="(e) => e.target.value.replace(/\s/g, '')"
            />
        </div>
        <div class="newOrRename-confirm">
            <span class="button" @click="close(0)">{{
                $t("common.cancel")
            }}</span>
            <span class="confirm" @click="close(1)">{{
                $t("common.confirm")
            }}</span>
        </div>
    </div>
</template>

<script>
import { nextTick } from "vue";
export default {
    data() {
        return {
            filePackage: this.filename,
        };
    },
    props: {
        title: { type: String, default: "" },
        filename: { type: String, default: "" },
        iconfont: { type: String, default: "" },
    },
    methods: {
        // 点击确认或关闭
        close(type) {
            console.log(type);
            // 关闭
            if (!type) {
                this.filePackage = "";
                this.$modal.hide("newOrRename-modal");
                return;
            }
            if (!this.filePackage) {
                this.$Message.warning(this.$t("disk.not_empty_name"));
                return;
            }
            if (this.filePackage && this.filePackage.length > 30) {
                this.$Message.warning(this.$t("disk.folder_name_length"));
                return;
            }
            this.$modal.hide("newOrRename-modal", {
                filePackage: this.filePackage,
            });
        },
    },
};
</script>

<style lang="less" scoped>
.newOrRename-wrap {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px;
    background: #fff;
    height: 100%;
    .newOrRename-title {
        height: 40px;
        line-height: 40px;
        text-align: center;
        font-size: 16px;
        font-weight: 600;
    }
    .newOrRename-content {
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        img {
            margin-right: 8px;
            width: 32px;
            height: 32px;
        }
        input {
            width: 300px;
            height: 32px;
            border-radius: 4px;
            border: 1px solid #ccc;
            padding: 0 5px;
            font-size: 14px;
            box-sizing: border-box;
            &:focus {
                outline: none;
                border-color: #1dbb88;
            }
        }
    }
    .newOrRename-confirm {
        text-align: center;
        margin-top: 10px;
        span {
            width: 80px;
            height: 32px;
            line-height: 32px;
            display: inline-block;
            background-color: #ffffff;
            border-radius: 4px;
            border: solid 1px rgba(151, 151, 151, 0.4);
            font-size: 14px;
            cursor: pointer;
            margin: 0 10px;
        }
        .confirm {
            background-color: #1dbb88;
            color: #fff;
        }
    }
}
</style>
