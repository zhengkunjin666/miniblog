// app.js
const util = require('./utils/util');

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
							const created_at = util.formatTime(new Date(res.data[0].created_at));
							const userInfo = { nickName, avatarUrl, created_at };
							that.globalData.userInfo = userInfo;
							that.globalData.openid = openid;
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
