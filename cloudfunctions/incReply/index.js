// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const topic_id = event.topic_id;
  try {
    return await db.collection("topic").doc(topic_id).update({
      data: {
        reply_count: _.inc(1)
      }
    });
  } catch(e) {
    console.error(e);
  }
}