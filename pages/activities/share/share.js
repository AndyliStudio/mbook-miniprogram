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
    code: '',
    wxcode: '',
    loaded: false
  },
  onShow: function() {
    let self = this
    // 等待用户登录完成
    let waitLoginCount = 0
    let waitLoginTimer = setInterval(function() {
      if (app.globalData.hasLogined) {
        self.getWxCode()
        clearInterval(waitLoginTimer)
      } else if (waitLoginCount >= 33) {
        clearInterval(waitLoginTimer)
        wx.navigateTo({
          url: '../../authfail/authfail'
        })
      } else {
        waitLoginCount++
      }
    }, 300)
    // 等待获取用户分享信息完成
    let waitGotShareInfoCount = 0
    let waitGotShareInfoTimer = setInterval(function() {
      if (app.globalData.hasGotShareInfo) {
        // 加载缓存中拿到的用户分享信息
        const shareInfo = wx.getStorageSync('share_info')
        const shareParams = wx.getStorageSync('share_params')
        if (shareInfo) {
          self.setData({ shareInfo: shareInfo })
        }
        // 如果url中存在code并且code符合规范，调用更新分享记录的接口
        const reg = /^[A-Za-z0-9-]+_\d+$/
        if (self.data.code && reg.test(self.data.code)) {
          app.updateShareLog(self.data.code).then(res => {
            if (res === true) {
              // 更新奖励
              self.flushAward()
            } else {
              if (!res.data.inviteself) {
                self.showToast(res.data ? (res.data.msg || '接收邀请失败') : '接收邀请失败' )
              }
            }
          })
        }
        self.setData({
          loaded: true,
          shareText: shareParams && shareParams.title ? shareParams.title : '一起来读书吧，接收我的邀请立即获得15书币哦~'
        })
        clearInterval(waitGotShareInfoTimer)
      } else if (waitLoginCount >= 33) {
        clearInterval(waitGotShareInfoTimer)
        wx.navigateTo({
          url: '../../authfail/authfail'
        })
      } else {
        waitGotShareInfoCount++
      }
    }, 300)
  },
  onLoad: function(options) {
    this.setData({
      code: options.code || ''
    })
  },
  flushAward: function() {
    let self = this
    app.getShareInfo().then(res => {
      if (res === true) {
        // 更新奖励
        const shareInfo = wx.getStorageSync('share_info')
        if (shareInfo) {
          self.setData({ shareInfo: shareInfo })
        }
      }
    })
  },
  // 分享逻辑
  onShareAppMessage: function(res) {
    let self = this
    // 获取分享出去的图片地址
    const shareParams = wx.getStorageSync('share_params')
    const now = new Date()
    const code = wx.getStorageSync('share_code') + '_' + now.getTime()
    if (shareParams) {
      return {
        title: shareParams.title,
        path: shareParams.page + '?code=' + code,
        imageUrl: shareParams.imageUrl,
        success: function(res) {
          // 转发成功
          // wx.showToast({ title: '分享成功', icon: 'success' })
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
  saveImage: function() {
    let self = this
    wx.downloadFile({
      url: self.data.wxcode, //仅为示例，并非真实的资源
      success: function(res) {
        // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: function(res) {
              wx.showToast({ title: '保存图片成功', icon: 'success' })
              setTimeout(function() {
                wx.hideToast()
              }, 2000)
            },
            fail: function(res) {
              self.showToast('保存图片失败', 'bottom')
            }
          })
        } else {
          self.showToast('下载图片失败', 'bottom')
        }
      }
    })
  },
  getWxCode: function() {
    let self = this
    let now = new Date()
    let code = wx.getStorageSync('share_code')
    if (code) {
      wx.request({
        url: config.base_url + '/api/get_share_img?share_type=friendQ&share_id=' + code + '_' + now.getTime(),
        header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
        success: res => {
          if (res.data.ok) {
            self.setData({ wxcode: res.data.img_url })
          } else if (res.data.authfail) {
            wx.navigateTo({
              url: '../authfail/authfail'
            })
          } else {
            self.showToast('获取分享朋友圈二维码失败', 'bottom')
          }
        },
        fail: err => {
          self.showToast('获取分享朋友圈二维码失败', 'bottom')
        }
      })
    } else {
      self.showToast('获取邀请码失败', 'bottom')
    }
  },
  pasteWxCode: function() {
    let self = this
    wx.setClipboardData({
      data: self.data.shareText,
      success: function(res) {
        wx.showToast({ title: '复制成功', icon: 'success' })
        setTimeout(function() {
          wx.hideToast()
        }, 2000)
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
