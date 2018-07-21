// pages/setting/webpage.js
const config = require('../../config')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    url: ''
  },
  onLoad: function(options) {
    let self = this
    let url = options.url
    if (url) {
      if (options.url.indexOf('activity/share') > -1) {
        // 获取userid
        const userinfo = app.globalData.userInfo
        // 判断 url是否已经携带参数
        if (url.indexOf('?') > -1) {
          url += '&uid=' + userinfo._id
        } else {
          url += '?uid=' + userinfo._id
        }
        self.setData({ url: url })
      } else {
        self.setData({ url: url })
      }
    } else {
      self.showToast('地址为空', 'bottom')
    }
  },
  // 接收来自h5页面的消息
  reciveMessage: function(event) {},
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
