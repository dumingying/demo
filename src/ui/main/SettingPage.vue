<template>
    <div class="setting-container">
        <h2 class="title">{{ $t("setting.setting") }}</h2>
        <div class="content">
            <figure class="chainpal">
                <img
                    src="../../assets/images/chainpal-icon.png"
                    draggable="false"
                />
            </figure>
            <label class="version"> V{{ currentVersion }} </label>
            <div class="btn-wrap">
                <button class="check-btn" @click="getVersion">
                    {{ $t("setting.update") }}
                    {{ latestVersion }}
                </button>
                <button class="about-btn" @click="getAbout">
                    {{ $t("setting.about_us") }}
                </button>
            </div>
            <ul class="action-wrap">
                <li>
                    {{ $t("setting.enable_notification") }}
                    <label
                        :class="{ active: sharedMiscState.enableNotification }"
                    >
                        <input
                            type="checkbox"
                            :checked="sharedMiscState.enableNotification"
                            @change="enableNotification($event.target.checked)"
                        />
                    </label>
                </li>
                <li>
                    {{ $t("setting.enable_notification_detail") }}
                    <label
                        :class="{
                            active: sharedMiscState.enableNotificationMessageDetail,
                        }"
                    >
                        <input
                            :disabled="!sharedMiscState.enableNotification"
                            type="checkbox"
                            :checked="
                                sharedMiscState.enableNotificationMessageDetail
                            "
                            @change="
                                enableNotificationDetail($event.target.checked)
                            "
                        />
                    </label>
                </li>
                <li v-if="sharedMiscState.isElectron">
                    {{ $t("setting.close_window_to_exit") }}
                    <label
                        :class="{
                            active: sharedMiscState.enableCloseWindowToExit,
                        }"
                    >
                        <input
                            type="checkbox"
                            :checked="sharedMiscState.enableCloseWindowToExit"
                            @change="
                                enableCloseWindowToExit($event.target.checked)
                            "
                        />
                    </label>
                </li>
                <li class="lang-btn">
                    {{ $t("setting.lang") }}
                    <Dropdown
                        class="my-dropdown-toggle"
                        @on-click="setLang"
                        trigger="click"
                    >
                        <template #list>
                            <DropdownMenu>
                                <DropdownItem
                                    v-for="item in langs"
                                    :key="item.lang"
                                    :name="item.lang"
                                    :selected="
                                        $store.state.currentLanguage ===
                                        item.lang
                                    "
                                    >{{ item.name }}
                                </DropdownItem>
                            </DropdownMenu>
                        </template>
                        <span> {{ currentLang }}</span>
                    </Dropdown>
                </li>

                <li
                    class="secret-btn"
                    v-if="showSecretView"
                    @click="goSecretToken"
                >
                    {{ $t("secretToken.secretSetting") }}
                    <Icon type="ios-arrow-forward" class="more-icon-btn" />
                </li>
            </ul>
        </div>
        <footer>
            <button class="button" @click="logout">
                {{ $t("setting.exit_switch_user") }}
            </button>
        </footer>
    </div>
</template>

<script>
import wfc from "@/wfc/client/wfc";
import store from "@/store";
import { unClearItem, setItem } from "@/ui/util/storageHelper";
import { ipcRenderer, isElectron } from "@/platform";
import SelectLanguage from "./SelectLanguage";
import pkg from "../../../package.json";
import { storeToRefs } from "pinia";
import useSecretTokenStore from "@/store/secretStore";
export default {
    name: "SettingPage",
    data() {
        return {
            sharedMiscState: store.state.misc,
            langs: [
                { lang: "zh-CN", name: "简体中文" },
                // { lang: "zh-TW", name: "繁體中文" },
                { lang: "en", name: "English" },
            ],
            currentVersion: pkg.version,
        };
    },
    computed: {
        currentLang() {
            let lang = this.$store.state.currentLanguage;
            let index = this.langs.findIndex((l) => l.lang === lang);
            index = index >= 0 ? index : 0;
            return this.langs[index].name;
        },
        latestVersion() {
            let isLatest = this.mixinCompareVersion(
                pkg.version,
                this.$store.state.newVersion
            );
            return isLatest === 1 ? this.$store.state.newVersion : "";
        },
        showSecretView() {
            let { secretStatus, secretPassword, secretConfig } = storeToRefs(
                useSecretTokenStore()
            );
            // 开启过秘密令牌，且有密码，且当前是显示的
            return (
                secretConfig.value &&
                !secretStatus.value &&
                secretPassword.value
            );
        },
    },
    methods: {
        setLang(lang) {
            if (lang !== this.$store.state.currentLanguage) {
                this.$modal.show(
                    SelectLanguage,
                    { title: "" },
                    null,
                    {
                        name: "SelectLanguage-modal",
                        width: 400,
                        height: 200,
                        clickToClose: false, // 点击模态框是否关闭
                    },
                    {
                        "before-close": (event) => {
                            console.log(event.params);
                            if (event.params && event.params.confirm) {
                                setItem("lang", lang);
                                this.$store.dispatch(
                                    "UpdateCurrentLanguage",
                                    lang
                                );
                                ipcRenderer.send("restart-setLanguage");
                                this.$i18n.locale = lang;
                            }
                        },
                    }
                );
            }
        },
        // 检查更新
        getVersion() {
            this.$eventBus.$emit("update-version", "setting");
        },
        // 点击退出
        logout() {
            //clear();
            unClearItem("lang");
            wfc.disconnect();
            if (isElectron()) {
                ipcRenderer.send("logouted");
            }
        },
        enableNotification(enable) {
            store.setEnableNotification(enable);
        },
        enableNotificationDetail(enable) {
            store.setEnableNotificationDetail(enable);
        },
        enableCloseWindowToExit(enable) {
            store.setEnableCloseWindowToExit(enable);
        },
        enableAutoLogin(enable) {
            store.setEnableAutoLogin(enable);
        },
        getAbout() {
            let lng =
                this.$store.state.currentLanguage === "en" ? "en" : "zh-CN";
            this.mixinGo2Web3View(`https://www.tongfudun.com?lng=${lng}`);
        },
        goSecretToken() {
            store.toggleSetSecretTokenView(true);
            this.$router.replace("/home/conversation");
        },
    },
};
</script>
<style>
.my-dropdown-toggle .ivu-dropdown-item {
    padding: 7px 16px;
}
.ivu-dropdown-item-selected,
.ivu-dropdown-item.ivu-dropdown-item-selected:hover {
    background: #1dbb88 !important;
}
.ivu-dropdown-item.ivu-dropdown-item-selected {
    color: #fff !important;
}
</style>
<style lang="less" scoped>
.setting-container {
    width: 100%;
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;

    .title {
        font-style: normal;
        font-weight: 500;
        padding: 30px 20px;
        color: #000000;
        font-size: 18px;
        line-height: 20px;
    }

    .content {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-content: center;
        align-items: center;
        margin-top: 30px;

        .chainpal {
            width: auto;
            height: 98px;
            margin-top: 12px;

            img {
                height: 98px;
            }
        }

        .version {
            margin: 10px 0;
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            text-align: center;
            letter-spacing: 0.04em;
            color: #999999;
        }

        .btn-wrap {
            margin-top: 2px;
            display: flex;
        }

        .check-btn,
        .about-btn {
            min-width: 120px;
            height: 28px;
            text-align: center;
            margin: 0 10px;
            background: none;
            outline: none;
            box-sizing: border-box;
            padding: 5px;
            border-radius: 10px;
            font-weight: 500;
            font-size: 12px;
            line-height: 18px;
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 400;
            font-size: 12px;
            line-height: 18px;
            color: #666666;
            border: 1px solid rgba(102, 102, 102, 1);
        }

        .about-btn {
            position: relative;
            padding-right: 14px;

            &::after {
                width: 14px;
                height: 10px;
                position: absolute;
                right: 10px;
                top: 9px;
                content: "";
                background: url(../../assets/images/link.png) no-repeat center
                    center;
                background-size: 100%;
            }
        }

        .check-btn {
            border: 1px solid rgba(29, 187, 136, 1);
            color: rgba(29, 187, 136, 1);
        }

        .action-wrap {
            width: 500px;
            margin-top: 49px;
            background: #fcfcfc;
            border: 1px solid #f0f0f0;
            border-radius: 10px;
            position: relative;
            padding: 20px 16px;

            &::before {
                position: absolute;
                top: -24px;
                left: 0;
                content: "";
                width: 100%;
                height: 1px;
                background: #f0f0f0;
                z-index: 1;
            }

            li {
                display: flex;
                justify-content: space-between;
                flex: 1;
                font-family: "PingFang SC";
                font-style: normal;
                font-weight: 400;
                font-size: 13px;
                line-height: 18px;
                color: #333333;
                padding-top: 10px;

                label {
                    width: 26px;
                    height: 16px;
                    overflow: hidden;
                    position: relative;
                    background: #e5e5e5;
                    border-radius: 8px;

                    &::before {
                        position: absolute;
                        top: 2px;
                        left: 2px;
                        content: "";
                        width: 12px;
                        height: 12px;
                        border-radius: 50px;
                        background: #ffffff;
                        border: 0.1px solid rgba(0, 0, 0, 0.03);
                        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.15);
                    }

                    &.active {
                        background: #1dbb88;
                        transition-delay: 0.02s;

                        &::before {
                            top: 2px;
                            left: 12px;
                        }
                    }

                    input {
                        width: 26px;
                        opacity: 0;
                    }
                }
                .more-icon-btn {
                    display: inline;
                    font-size: 20px;
                    vertical-align: middle;
                    color: #666;
                    margin-right: -6px;
                }
            }
        }

        .lang-btn {
            width: 100%;
        }
        .my-dropdown-toggle {
            width: 100px;
            text-align: right;
        }
    }

    footer {
        width: 100%;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        border-top: 1px solid #d9d9d9;

        .button {
            margin-right: 17px;
            color: #000000;
            font-size: 14px;
            padding: 9px 8px;
            border: 0;
            border-radius: 2px;
            background: 0;
            outline: 0;
            text-align: left;
            cursor: pointer;
            text-decoration: none;
            transform: translateY(0px);
            transition: 0.2s;
        }
    }
}
</style>
