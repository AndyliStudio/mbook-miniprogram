// pages/user/user.js
const config = require('../../config')
const utils = require('../../utils/util')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    userInfo: null,
    amount: 0,
    text: '',
    shutChargeTips: false
  },
  onShow: function() {},
  onLoad: function() {
    // 获取屏幕高度
    this.setData({
      userInfo: app.globalData.userInfo,
      shutChargeTips: app.globalData.globalSetting.shut_charge_tips || false
    })
    // 当前页面不予许分享
    wx.hideShareMenu()
  }
})
