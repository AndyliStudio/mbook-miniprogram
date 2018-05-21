// pages/user/user.js
const config = require('../../config')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    page: ''
  },
  onLoad: function(options) {
    let page = options.page || ''
    this.setData({ page: page })
  },
  doLogin: function() {
    let self = this
    app.doLogin().then(res => {
      if (res === true) {
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 0
        })
        // 返回上一页
        wx.navigateBack({
          delta: 1
        })
      }
    })
  },
  afterGetUserInfo: function() {
    app.doLogin().then(res => {
      if (res === true) {
        app.globalData.hasLogined = true
        app.getShareInfo().then(res2 => {
          if (res2 === true) {
            app.globalData.hasGotShareInfo = true
            wx.showToast({
              title: '授权完成',
              icon: 'success',
              duration: 0
            })
            // 返回上一页
            wx.navigateBack({
              delta: 1
            })
          }
        })
      }
    })
  },
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
