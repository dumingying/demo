<template>
  <div id="global-uploader" ref="globalUploader">
    <!-- 上传 -->
    <uploader
      ref="uploader"
      class="uploader-app uploader-show"
      :options="getOptions()"
      :autoStart="false"
      :file-status-text="fileStatusText"
      @file-added="onFileAdded"
      @file-success="onFileSuccess"
      @file-error="onFileError"
      @file-removed="onFileRemoved"
    >
      <uploader-unsupport></uploader-unsupport>
      <uploader-btn id="global-uploader-btn" :attrs="attrs" ref="uploadBtn">{{
        $t("disk.selectFile")
      }}</uploader-btn>
      <uploader-list v-slot="props">
        <div class="file-panel">
          <div class="file-title">
            <span>{{ $t("disk.upload_list") }}</span>
          </div>
          <ul class="file-list" ref="fileList">
            <li v-for="file in props.fileList" :key="file.id">
              <uploader-file
                :class="'file_' + file.id"
                ref="files"
                :file="file"
                :list="true"
              >
              </uploader-file>
            </li>
            <li class="no-file" v-if="!props.fileList.length">
              <Icon type="ios-folder" /><span>{{ $t("disk.no_data") }}</span>
            </li>
          </ul>
        </div>
      </uploader-list>
    </uploader>
  </div>
</template>

<script>
import SparkMD5 from "spark-md5";
import { tipsContent } from "@/ui/common/Tips";
import { getCheckUploadEnvironment, getStopUpload, getPostUpload } from "@/axios";
import { imageThumbnail, videoDuration, videoThumbnail } from "@/ui/util/imageUtil";
import { generateFileID } from "@/ui/util/idGenerate";
export default {
  data: function () {
    return {
      attrs: {
        accept: this.mixinUploaderFileType("all"),
      },
      fileStatusText: {
        success: this.$t("common.uploaded_success"),
        error: this.$t("common.uploaded_error"),
        uploading: this.$t("common.uploading"),
        paused: this.$t("common.paused"),
        waiting: this.$t("common.waiting"),
      },
      params: {
        userId: "",
        parentFolderId: "",
      },
    };
  },
  mounted() {
    this.$eventBus.$on("openUploader", (query) => {
      this.params = query || {};
      //   console.log("触发openUploader");
      if (this.$refs.uploadBtn) {
        this.$refs.uploadBtn.$el.click();
      }
    });
    this.$eventBus.$on("uploadDrop", (file) => {
      console.log("uploadDrop", file);
      if (this.$refs["uploader"]) {
        let uploader = this.$refs["uploader"].uploader;
        let fileArray = [];
        this.params.userId = file.userId;
        this.params.parentFolderId = file.parentFolderId;
        for (let i = 0; i < file.files.length; i++) {
          fileArray.push(file.files[i]);
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
              console.log(e, "catch error，不可以上传文件夹");
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
        chunkSize: 10485760, // 10 mb //分块大小(单位：字节)
        fileParameterName: "file", //上传文件时文件内容的参数名，对应chunk里的Multipart对象名，默认对象名为file
        maxChunkRetries: 3, //失败后最多自动重试上传次数
        testChunks: false, //是否开启服务器分片校验
        processParams(params, file) {
          const { name, parentId, fileId } = file;
          params.fileName = name;
          params.parentId = parentId;
          params.fileId = fileId;
          return params;
        },
        query: (file) => {
          const { userId, cycleMeetingId, meetingId } = this.params;
          return {
            userId,
            meetingId,
            cycleMeetingId,
            repeType: "default",
            fileMD5: file.uniqueIdentifier,
          };
        },
      };
    },
    // 添加到下载列表
    onFileAdded(file) {
      let type = file.getType();
      file.parentId = this.params.parentFolderId;
      file.fileId = generateFileID();
      if (type === "zip" || type == "rar") {
        this.$nextTick(() => {
          this.$refs["globalUploader"].querySelector(
            `.file_${file.id} .uploader-file-icon`
          );
        });
      }
      this.computeMD5(file);
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
    // 分片上传成功
    async onFileSuccess(rootFile, file, response, chunk) {
      try {
        let res = JSON.parse(response);
        // 服务器自定义的错误（即虽返回200，但是是错误的情况），这种错误是Uploader无法拦截的
        if (res.code !== "000000") {
          this.$Message.error(res.message);
          this.statusSet(file.id, "failed"); // 文件状态设为“失败”
          return;
        }
        //上传缩率图
        let type = file.getType();
        if (
          this.mixinIsImageExt(type) ||
          (this.mixinIsVideoExt(type) && !(file.fileType.indexOf("audio") > -1))
        ) {
          let thumbnailFile, duration;
          let filename = file.name;
          filename = filename.substring(0, filename.lastIndexOf(".") + 1) + "jpeg";
          //图片和视频文件
          if (this.mixinIsImageExt(type)) {
            let imgBase64_image = await imageThumbnail(file.file);
            if (imgBase64_image) {
              thumbnailFile = await this.mixinBase64toFile(imgBase64_image, filename);
            }
          } else {
            let imgBase64_video = await videoThumbnail(file.file);
            if (imgBase64_video) {
              thumbnailFile = await this.mixinBase64toFile(imgBase64_video, filename);
            }
            duration = await videoDuration(file.file);
            duration = Math.ceil(duration * 1000);
          }
          this.$nextTick(async () => {
            try {
              let formData = new FormData();
              formData.append("shotcut", thumbnailFile);
              formData.append("nodeId", file.fileId);
              formData.append("filename", filename);
              formData.append("videoTime", duration);
              let res = await getPostUpload(formData);
              const { code, message } = res.data;
              if (code === "000000") {
                this.$eventBus.$emit("uploadSuccess", this.params.parentFolderId);
              } else {
                console.log(message);
              }
            } catch (error) {
              console.error("Error:", error);
            }
          });
        } else {
          this.$eventBus.$emit("uploadSuccess", this.params.parentFolderId);
        }
      } catch (error) {}
    },
    onFileError(rootFile, file, response, chunk) {
      this.$Message.error(this.$t("common.uploaded_error"));
    },
    /**
     * 计算md5，实现断点续传及秒传
     * @param file
     */
    computeMD5(file) {
      let fileReader = new FileReader();
      let currentChunk = 0;
      const chunkSize = 10485760;
      let chunks = Math.ceil(file.size / chunkSize);
      console.log(chunks, "多少片");
      let spark = new SparkMD5.ArrayBuffer();
      // 文件状态设为"计算MD5"
      this.statusSet(file.id, "md5");
      this.loadNext(fileReader, file, currentChunk, chunkSize);
      fileReader.onload = (e) => {
        spark.append(e.target.result);
        if (currentChunk < chunks) {
          currentChunk++;
          this.loadNext(fileReader, file, currentChunk, chunkSize);
          // 实时展示MD5的计算进度
          this.$nextTick(() => {
            let thisDom = this.$refs["globalUploader"].querySelector(
              `.myStatus_${file.id}`
            );
            thisDom &&
              (thisDom.innerText = `${this.$t("disk.verify_MD5")}${(
                (currentChunk / chunks) *
                100
              ).toFixed(0)}%`);
          });
        } else {
          let md5 = spark.end();
          this.computeMD5Success(md5, file);
          //   console.log(
          //     `MD5计算完毕：${file.name} \nMD5：${md5} \n分片：${chunks} 大小:${
          //       file.size
          //     } 用时：${new Date().getTime() - time} ms`
          //   );
        }
      };
      fileReader.onerror = function () {
        this.error(this.$t("disk.read_error", file.name));
        file.cancel();
      };
    },
    loadNext(fileReader, file, currentChunk, chunkSize) {
      let start = currentChunk * chunkSize;
      let end = start + chunkSize >= file.size ? file.size : start + chunkSize;
      let blobSlice =
        File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
      fileReader.readAsArrayBuffer(blobSlice.call(file.file, start, end));
    },
    async computeMD5Success(md5, file) {
      file.uniqueIdentifier = md5;
      this.statusRemove(file.id);
      try {
        // 上传文件前置检查
        let res = await getCheckUploadEnvironment({
          userId: this.params.userId,
          fileId: file.fileId,
          totalSize: file.size,
        });
        const { code, message, data } = res.data;
        if (code == "000000") {
          file.resume();
        } else {
          file.cancel();
          if (code === "1400014") {
            this.$alert({
              content: tipsContent[4],
              height: 150,
              cancelText: "",
            });
          } else {
            this.$Message.error(message);
          }
        }
      } catch (error) {
        this.$Message.error(this.$t("common.error_later"));
      }
    },
    /**
     * 新增的自定义的状态: 'md5'、'transcoding'、'failed'
     * @param id
     * @param status
     */
    statusSet(id, status) {
      let statusMap = {
        md5: {
          text: this.$t("disk.verify_MD5"),
          bgc: "#fff",
        },
        merging: {
          text: this.$t("disk.merging"),
          bgc: "#e2eeff",
        },
        transcoding: {
          text: this.$t("disk.transcoding"),
          bgc: "#e2eeff",
        },
        failed: {
          text: this.$t("disk.upload_failed"),
          bgc: "#e2eeff",
        },
      };
      this.$nextTick(() => {
        let newDomP = `<p class="myStatus_${id}" style="position: 'absolute', top: '0', left: '0',right: '0', bottom: '0',zIndex: '1', backgroundColor:${statusMap[status].bgc}"></p>`;
        let fileDom = this.$refs["globalUploader"].querySelector(
          `.file_${id} .uploader-file-status`
        );
        if (fileDom) {
          fileDom.innerHTML = newDomP;
          fileDom.querySelector(`.myStatus_${id}`).innerText = statusMap[status].text;
        }
      });
    },
    statusRemove(id) {
      this.$nextTick(() => {
        let thisDom = this.$refs["globalUploader"].querySelector(`.myStatus_${id}`);
        thisDom && thisDom.remove();
      });
    },
    error(msg) {
      this.$Message.error(msg);
    },
    click(el) {
      let evt = document.createEvent("Event");
      evt.initEvent("click", true, true);
      el.dispatchEvent(evt);
    },
  },
  beforeUnmount() {
    this.$eventBus.$off("openUploader");
    this.$eventBus.$off("uploadDrop");
  },
};
</script>

<style scoped lang="less">
#global-uploader {
  position: fixed;
  z-index: 20;
  top: 130px;
  right: 20px;
  background: #fff;

  .uploader-app {
    width: 48px;
  }

  .uploader-show {
    width: 380px;
  }

  .file-panel {
    background-color: #fff;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);

    .file-title {
      display: flex;
      height: 40px;
      line-height: 40px;
      border-bottom: 1px solid #ddd;
      font-size: 14px;
      padding: 0 20px;

      //   .operate {
      //     flex: 1;
      //     text-align: right;

      //     .el-iconfont-normal {
      //       &:hover {
      //         color: #9ecaed;
      //       }
      //     }

      //     .el-iconfont-cancel {
      //       &:hover {
      //         color: red;
      //       }
      //     }
      //   }
    }

    .file-list {
      position: relative;
      height: 240px;
      overflow-x: hidden;
      overflow-y: auto;
      background-color: #fff;

      > li {
        background-color: #fff;
        font-size: 12px;
      }
    }
  }

  .no-file {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
    vertical-align: middle;

    i {
      font-size: 18px;
      margin-right: 10px;
      vertical-align: middle;
    }
  }

  ::v-deep(.uploader-file-name) {
    text-indent: 0 !important;
    padding-left: 8px;
    box-sizing: border-box;
  }

  ::v-deep(.uploader-file-size) {
    text-indent: 0;
    padding-left: 8px;
    box-sizing: border-box;
  }

  ::v-deep(.uploader-file-meta) {
    width: 2%;
  }

  ::v-deep(.uploader-file-status) {
    //隐藏上传剩余时间 修复样式bug
    span {
      i {
        display: none;
      }
    }
  }

  ::v-deep(.uploader-file-icon) {
    &:before {
      content: "" !important;
    }

    &[icon="image"] {
      background: url(../../../assets/images/image-icon.png);
    }

    &[icon="video"] {
      background: url(../../../assets/images/video-icon.png);
    }

    &[icon="document"] {
      background: url(../../../assets/images/text-icon.png);
    }

    &[icon="audio"] {
      background: url(../../../assets/images/music.png);
    }

    &[icon="zip"] {
      background: url(../../../assets/images/zip.png);
    }

    &[icon="unknown"] {
      background: url(../../../assets/images/unknown.png);
    }
  }

  ::v-deep(.uploader-file-actions) {
    width: 16%;
  }
}

/* 隐藏上传按钮 */
#global-uploader-btn {
  position: absolute;
  clip: rect(0, 0, 0, 0);
  cursor: pointer;

  ::v-deep(input) {
    cursor: pointer !important;
  }
}
</style>
