// pages/user/user.js
const config = require('../../config')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    minute: 0,
    num: 0
  },
  onLoad: function () {
    this.getInfo()
  },
  getInfo: function(){
    let self = this
    wx.request({
      url: config.base_url + '/api/read_time/my',
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      success: res => {
        if(res.data.ok){
          self.setData({ 'minute': res.data.minute, 'num': res.data.num })
        }else{
          self.showToast('获取阅读时长失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取阅读时长失败', 'bottom')
      }
    })
  },
  getAward: function() {
    let self = this
    if (self.data.num > 0) {
      wx.request({
        url: config.base_url + '/api/read_time/exchange',
        header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
        success: res => {
          if(res.data.ok){
            wx.showToast({title: '兑换成功', icon: 'success'})
            setTimeout(function(){
              wx.hideLoading()
            },2000)
            self.setData({ 'minute': 0, 'num': 0 })
          }else{
            self.showToast('获取阅读时长失败', 'bottom')
          }
        },
        fail: err => {
          self.showToast('获取阅读时长失败', 'bottom')
        }
      })
    } else {
      self.showToast('当前阅读时长不足以兑换书币', 'bottom')
    }
  },
  showToast: function(content, position){
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function(){
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})