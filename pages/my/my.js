// pages/my/my.js
const App = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    hasUser: false,
    userInfo: {},
  },
  onLoad() {
    this.loading();
  },
  loading() {
    this.hasUserInfo();
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
        let userInfo = res.userInfo;
        const name = userInfo.nickName;
        const avatar = userInfo.avatarUrl;
        const db = wx.cloud.database();
        const created_at = db.serverDate();
        db.collection("user").add({
          data: {
            name,
            avatar,
            created_at,
            isManager: false,
          }
        })
        .then(() => {
          userInfo.created_at = util.formatTime(new Date());
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