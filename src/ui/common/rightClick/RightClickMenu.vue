<template>
    <vue-context ref="menu" class="default-right-click-menu">
        <li>
            <a @click.prevent="handlePaste($event)">{{ $t("common.paste") }}</a>
        </li>
        <li :class="{ disabled: !inputText }">
            <a @click.prevent="copy">
                {{ $t("common.copy") }}
            </a>
        </li>
        <li :class="{ disabled: !inputText }">
            <a @click.prevent="cut">{{ $t("common.cut") }}</a>
        </li>
    </vue-context>
</template>

<script>
import { copyText } from "@/ui/util/clipboard";
export default {
    props: {
        inputText: {
            type: String,
        },
    },
    data() {
        return {};
    },
    methods: {
        async handlePaste(e) {
            let text;
            e.preventDefault();
            if ((e.originalEvent || e).clipboardData) {
                text = (e.originalEvent || e).clipboardData.getData(
                    "text/plain"
                );
            } else {
                text = await navigator.clipboard.readText();
            }
            if (text && text.trim()) {
                document.execCommand("insertText", false, text);
            }
        },
        copy() {
            this.inputText && copyText(this.inputText);
        },
        cut() {
            this.copy();
            this.$emit("resetInputText");
        },
    },
};
</script>
<style lang="less"></style>
