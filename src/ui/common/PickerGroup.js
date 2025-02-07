import PickGroupView from "../main/pick/PickGroupView";
export default {
    install(app, options) {
        app.config.globalProperties.$pickGroups = function (options) {
            let beforeClose = (event) => {
                if (!event.params) {
                    options.failCB && options.failCB(-1);
                    return;
                }
                options.successCB && options.successCB(event.params.groups);
            };
            const {
                title, // 弹窗标题名称
                initCheckedGroupIds, // 已选择的
                uncheckableGroupIds, // 已选且不可编辑的
                localGroup, // 本地群组
                singleChoice, // 单选
                confirmTitle, // 确认按钮文案
                confirmCallback, // 点击确定回调方法
            } = options;

            this.$modal.show(
                PickGroupView,
                {
                    title: title || this.$t("voip.select_discussion_group"),
                    localGroup,
                    singleChoice,
                    confirmCallback,
                    initCheckedGroupIds,
                    uncheckableGroupIds,
                    confirmTitle: confirmTitle || this.$t("common.confirm"),
                },
                null,
                {
                    name: "pick-group-modal",
                    width: 600,
                    height: 480,
                    clickToClose: false,
                    escToClose: true,
                },
                {
                    "before-close": beforeClose,
                }
            );
        };
    },
};
