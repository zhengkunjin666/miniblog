// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: "cloud1-2gh9k9bo21f99f8a" });
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const number = event.skip;
  let openid = event.openid;
  let publisher;
  !openid ? openid : publisher = openid;
  return db.collection("topic").aggregate().match({ publisher })
  .lookup({
    from: "user",
    localField: "publisher",
    foreignField: "_openid",
    as: "userInfo"
  })
  .sort({ created_at: -1 })
  .skip(number)
  .limit(10)
  .end()
  .then(res => data = res)
  .catch(err => data = err);
}