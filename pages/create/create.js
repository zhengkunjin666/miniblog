// pages/create/create.js
const App = getApp();
const db = wx.cloud.database();

Page({
  data: {
    imageList: [],
    num: "",
    videoList: [],
  },
  content: "",
  handleChange(event) {
    const content = event.detail.html;
    this.content = content;
  },
  handleUpload() {
    const that = this;
    wx.showActionSheet({
      itemList: ["图片", "视频"],
      success(res) {
        const tapIndex = res.tapIndex;
        switch(tapIndex)  {
          case 0: 
            wx.chooseMedia({
              count: 9,
              mediaType: "image",
              success(res) {
                if (res.type == "image") {
                  const type = "image";
                  const filePathArr = res.tempFiles;
                  that.uploadFile(type, filePathArr);
                } else {
                  wx.showToast({
                    title: "只能选择图片",
                    icon: "error",
                    mask: true,
                  })
                }
              },
            })
            break;
          case 1: 
            wx.chooseMedia({
              count: 1,
              mediaType: "video",
              success(res) {
                if (res.type == "video") {
                  const type = "video";
                  const filePathArr = res.tempFiles;
                  that.uploadFile(type,filePathArr)
                } else {
                  wx.showToast({
                    title: "只能选择视频",
                    icon: "error",
                    mask: true,
                  })
                }
              }
            })
        }
      }
    })
  },
  uploadFile(type, arr) {
    wx.showLoading({
      title: "上传中",
      mask: true,
    });
    const openid = App.globalData.openid;
    let imageList = [];
    let videoList = [];
    let count = 1;
    const that = this;
    arr.map((data, index) => {
      const filePath = data.tempFilePath;
      const postfix = filePath.match(/\.[^.]+?$/);
      const timestamp = new Date().getTime() + count;
      count++;
      const cloudPath = `${openid}_${timestamp}${postfix}`
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success(res) {
          if (type === "image") {
            imageList.push(res.fileID);
          } else {
            videoList.push(res.fileID);
          }
          that.setData({
            imageList,
            videoList
          });
          if (arr.length - 1  == index) {
            wx.hideLoading();
          }
        },
        fail() {
          wx.hideLoading();
          setTimeout(() => {
            wx.showToast({
              title: "上传失败",
              icon: "error"
            })
          }, 200);
        }
      })
    });
    if (arr.length == 1) {
      const num = "one";
      that.setData({ num });
    } else if (arr.length == 2) {
      const num = "two";
      that.setData({ num });
    } else if (arr.length > 2) {
      that.setData({ num: "" });
    }
  },
  previewImage(e) {
    const current = e.target.dataset.src;
    wx.previewImage({
      current,
      urls: this.data.imageList
    })
  },
  handleSubmit() {
    const content = this.content;
    const imageList = this.data.imageList;
    const videoList = this.data.videoList;
    const publisher = "{openid}";
    const created_at = db.serverDate();
    if (!content && imageList.length == 0 && videoList.length == 0) {
      wx.showToast({
        title: "请输入内容",
        icon: "none"
      });
      return;
    }
    wx.showLoading({
      title: "上传中",
      mask: true,
    })
    db.collection("topic").add({
      data: { content, imageList, videoList, publisher, created_at },
      success(res) {
        const url = `/pages/detail/detail?id=${res._id}`;
        wx.redirectTo({ url });
      },
      fail() {
        wx.hideLoading();
        setTimeout(() => {
          wx.showToast({
            title: "发布失败",
            icon: "error",
            mask: true
          })
        }, 300);
      },
    })
  }
})