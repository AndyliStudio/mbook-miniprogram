// pages/setting/webpage.js
const config = require('../../../config')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    url: '',
    shareInfo: {
      todayAwardNum: 0,
      todayInviteNum: 0,
      totalAwardNum: 0,
      totalInviteNum: 0
    },
    loaded: false
  },
  onLoad: function (options) {
    let self = this
    // 加载缓存中拿到的用户分享信息
    const shareInfo = wx.getStorageSync('share_info')
    if (shareInfo) {
      self.setData({ 'shareInfo': shareInfo })
    }
    // 如果url中存在code并且code符合规范，调用更新分享记录的接口
    const reg = /^[A-Za-z0-9-]+_\d+$/
    if (options.code && reg.test(options.code)) {
      app.updateShareLog(options.code).then(res => {
        if (res === true) {
          // 更新奖励
          self.flushAward()
        }
      })
    }
    self.setData({ 'loaded': true })
  },
  flushAward: function() {
    let self = this
    app.getShareInfo().then(res => {
      if(res === true) {
        // 更新奖励
        const shareInfo = wx.getStorageSync('share_info')
        if (shareInfo) {
          self.setData({ 'shareInfo': shareInfo })
        }
      }
    })
  },
  // 分享逻辑
  onShareAppMessage: function (res) {
    let self = this
    // 获取分享出去的图片地址
    const shareParams = wx.getStorageSync('share_params')
    const now = new Date()
    const code = wx.getStorageSync('share_code') + now.getTime()
    if (shareParams) {
      return {
        title: shareParams.title,
        path: shareParams.path + '?code' + code,
        imageUrl: shareParams.imageUrl,
        success: function(res) {
          console.log(res)
          // 转发成功
          wx.showToast({title: '分享成功', icon: 'success'})
        },
        fail: function(res) {
          // 取消分享
        }
      }
    } else {
      self.showToast('获取分享参数失败', 'bottom')
      return false
    }   
  },
  gotoIndex: function() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
  showToast: function(content, position){
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function(){
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
