// app.js
App({
  onLaunch() {
		this.cloudInit();
		this.getUserInfo();
	},
	cloudInit() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
				env: 'cloud1-2gh9k9bo21f99f8a',
        traceUser: true,
      });
		}
	},
	getUserInfo() {
		const that = this;
		wx.cloud.callFunction({
			name: "wxContext",
			success(res) {
				const openid = res.result.openid;
				const db = wx.cloud.database();
				db.collection("user").where({
					_openid: openid,
				}).get({
					success(res) {
						if (res.data.length > 0) {
							const nickName = res.data[0].name;
							const avatarUrl = res.data[0].avatar;
							const userInfo = { nickName, avatarUrl };
							that.globalData.userInfo = userInfo;
							that.globalData.openid = openid;
						} else {
							wx.switchTab({
								url: '/pages/my/my',
								success() {
									wx.showModal({
										title: "信息提示",
										content: "需要在此授权登录后才可评论与发布微博哦！",
										showCancel: false,
										confirmText: "我已知晓",
									})
								}
							})
						}
					}
				});
			},
			fail(err) {
				console.error("[云函数] [wxContext] 调用失败", err);
			}
		})
	},
	globalData: {
		openid: "",
		userInfo: {},
	}
});
