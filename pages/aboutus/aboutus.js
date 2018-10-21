// pages/user/user.js
const config = require('../../config')

Page({
  data: {
    onLoad: function() {
      // 当前页面不予许分享
      wx.hideShareMenu()
    }
  }
})
