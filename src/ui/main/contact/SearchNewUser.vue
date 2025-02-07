<template>
    <div class="search-new-user">
        <h4 class="header">{{ $t("friend_request.find_user") }}</h4>
        <div class="tel-wrap">
            <input
                type="text"
                :placeholder="$t('friend_request.enter_mobile')"
                class="input"
                v-model="query"
            />
        </div>
        <button
            :class="['search-btn', !query && 'disabled']"
            @click="handlerSearch"
        >
            {{ $t("common.search") }}
        </button>
    </div>
</template>

<script>
import NewFriendsList from "./NewFriendsList";
import { postSearchUser } from "@/axios";

export default {
    name: "SearchNewUser",
    data() {
        return {
            query: "",
            lock: false,
        };
    },
    computed: {
        isEn() {
            return this.$store.state.currentLanguage === "en";
        },
    },
    methods: {
        async handlerSearch() {
            if (!this.query) return;
            if (this.lock) return;
            this.lock = true;
            try {
                let res = await postSearchUser({ searchContent: this.query });
                this.lock = false;
                let { data, code, message } = res.data;
                if (code === "000000") {
                    data.length
                        ? this.showSearchResult(data)
                        : this.$alert({
                              content: this.$t("login.not_chainpal_user_tip"),
                              isText: true,
                              cancelText: "",
                          });
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.lock = false;
            }
        },
        showSearchResult(newFriends) {
            this.$modal.show(
                NewFriendsList,
                {
                    list: newFriends,
                },
                null,
                {
                    name: "new-friends-list",
                    width: 420,
                    height: 450,
                    clickToClose: false,
                },
                {
                    "before-close": () => {},
                    closed: () => {},
                }
            );
        },
    },
};
</script>
<style lang="less" scoped>
.search-new-user {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 70px;
    text-align: center;
    box-sizing: border-box;
}
.header {
    margin-top: 60px;
    line-height: 30px;
    font-size: 16px;
}

.tel-wrap {
    margin-top: 40px;
    text-align: center;
    input {
        width: 100%;
        height: 60px;
        background: #f6f8fa;
        padding: 16px 20px;
        border-radius: 12px;
        outline: none;
        border: 1px solid #f6f8fa;
        box-sizing: border-box;
        &:focus-visible {
            border: 1px solid #1dbb88;
        }
    }
}
.search-btn {
    max-width: 400px;
    width: 100%;
    height: 48px;
    margin-top: 60px;
    box-sizing: border-box;
    background-color: #1dbb88;
    border-radius: 24px;
    border: 1px solid transparent;
    opacity: 1;
    color: white;
    font-size: 14px;
    &.disabled {
        opacity: 0.6;
    }
}
</style>
