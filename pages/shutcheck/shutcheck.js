// pages/shutcheck/shutcheck.js
const app = getApp()
Page({
  data: {
    onLoad: function() {
      // 当前页面不予许分享
      wx.hideShareMenu()
    }
  }
})
