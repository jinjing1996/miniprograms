const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 点赞/取消点赞：userLikes 记录用户行为，posts.likes 原子增减（云函数管理员权限绕过读写规则）
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { postId } = event;
  const likes = db.collection('userLikes');
  const exist = await likes.where({ openid: OPENID, postId }).get();

  let liked;
  if (exist.data.length) {
    await likes.doc(exist.data[0]._id).remove();
    liked = false;
  } else {
    await likes.add({ data: { openid: OPENID, postId } });
    liked = true;
  }
  await db.collection('posts').doc(postId).update({
    data: { likes: _.inc(liked ? 1 : -1) }
  });
  const post = await db.collection('posts').doc(postId).get();
  return { liked, likes: post.data.likes };
};
