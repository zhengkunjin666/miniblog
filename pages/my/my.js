// pages/my/my.js
const App = getApp();

Page({
  data: {
    hasUser: false,
    userInfo: {},
  },
  onLoad() {
    this.loading();
  },
  loading() {
    wx.showLoading({
      title: "加载中",
      mask: true,
    })
    setTimeout(() => {
      this.hasUserInfo();
      wx.hideLoading();
    }, 1000);
  },
  onShow() {
    this.hasUserInfo();
  },
  hasUserInfo() {
    const userInfo = App.globalData.userInfo;
    if (userInfo.nickName) {
      this.setData({
        hasUser: true,
        userInfo: userInfo,
      })
    }
  },
  getUserInfo() {
    const that = this;
    wx.getUserProfile({
      desc: "用于获取用户头像和昵称",
      success(res) {
        const userInfo = res.userInfo;
        const name = userInfo.nickName;
        const avatar = userInfo.avatarUrl;
        const db = wx.cloud.database();
        db.collection("user").add({
          data: {
            name,
            avatar,
            isManager: false,
          }
        })
        .then(() => {
          that.setData({
            hasUser: true,
            userInfo: userInfo,
          });
          App.globalData.userInfo = userInfo;
        })
        .catch(() => {
          wx.showToast({
            title: '网络错误',
            icon: error,
            mask: true
          })
        })
      }
    })
  }
})