import AlertView from "./AlertView.vue";

export default {
    install(app) {
        app.config.globalProperties.$alert = function (options) {
            if (typeof options.clickToClose === "undefined") {
                options.clickToClose = true;
            }
            let beforeOpen = () => {
                console.log("Opening...");
            };
            let beforeClose = (event) => {
                // What a gamble... 50% chance to cancel closing
                if (!event.params) {
                    return;
                }
                if (event.params.confirm) {
                    options.confirmCallback && options.confirmCallback();
                } else {
                    options.cancelCallback &&
                        options.cancelCallback(event.params);
                }
            };
            let closed = (event) => {
                console.log("Close...", event);
            };
            this.$modal.show(
                AlertView,
                {
                    ...options,
                    title: options.title,
                    tipContent: options.content,
                    isText: options.isText,
                    isMainWindow: options.isMainWindow,
                    confirmText: options.confirmText,
                    cancelText: options.cancelText,
                },
                null,
                {
                    name: "alert-modal",
                    clickToClose: options.clickToClose,
                    adaptive: true,
                    width: options.width || 320,
                    height: options.height || 200,
                },
                {
                    "before-open": beforeOpen,
                    "before-close": beforeClose,
                    closed: closed,
                }
            );
        };
    },
};
