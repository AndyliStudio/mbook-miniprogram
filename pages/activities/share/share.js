// pages/setting/webpage.js
const config = require('../../../config')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    modal: {
      show: false,
      name: '',
      inputValue: '',
      title: '温馨提示',
      opacity: 0.6,
      position: 'center',
      width: '80%',
      options: {
        fullscreen: false,
        showclose: true,
        showfooter: true,
        closeonclickmodal: true,
        confirmText: ''
      }
    },
    url: '',
    shareInfo: {
      todayAwardNum: 0,
      todayInviteNum: 0,
      totalAwardNum: 0,
      totalInviteNum: 0
    },
    awardRecords: [],
    code: '', // 邀请码
    wxcode: '', // 邀请二维码
    records: [
      {
        name: '月光倾城',
        type: '接收邀请',
        time: '2018/07/17'
      },
      {
        name: '月光倾城',
        type: '接收邀请',
        time: '2018/07/17'
      },
      {
        name: '月光倾城',
        type: '接收邀请',
        time: '2018/07/17'
      },
      {
        name: '月光倾城',
        type: '接收邀请',
        time: '2018/07/17'
      }
    ], // 邀请记录
    hasMore: true,
    page: 1,
    showSharePanel: '' // 是否展示分享面板
  },
  onShow: function() {
    let self = this
    // 拿到的用户分享信息
    let records = []
    if (app.globalData.awardRecords && app.globalData.awardRecords instanceof Array) {
      records = app.globalData.awardRecords.slice((self.data.page - 1) * 5, self.data.page * 5)
    }
    self.setData({ shareInfo: app.globalData.shareInfo, awardRecords: records })
    // 如果url中存在code并且code符合规范，调用更新分享记录的接口
    const reg = /^[A-Za-z0-9-]+_\d+$/
    if (self.data.code && reg.test(self.data.code)) {
      self.updateShareLog(self.data.code)
    }
    // 判断是否需要刷新奖励信息
    if (app.globalData.loadedShare) {
      self.flushAward()
    } else {
      app.globalData.loadedShare = true
    }
  },
  onLoad: function(options) {
    this.setData({
      code: options.code || ''
    })
  },
  openSharePanel: function() {
    this.setData({ showSharePanel: true })
  },
  closeSharePanel: function() {
    this.setData({ showSharePanel: false })
  },
  updateShareLog: function(share_id) {
    let self = this
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/share/update?share_id=' + share_id,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          wx.showToast({ title: '获得15书币的奖励', icon: 'success' })
          setTimeout(function() {
            wx.hideToast()
          }, 2000)
          self.flushAward()
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../authfail/authfail'
          })
        } else {
          utils.debug('调用接口失败--/api/share/update' + JSON.stringify(res))
          self.showToast('接收邀请失败', 'bottom')
        }
      },
      fail: err => {
        utils.debug('调用接口失败--/api/share/update' + JSON.stringify(err))
        self.showToast('接收邀请失败', 'bottom')
        // 自动重新尝试
        setTimeout(function() {
          self.updateShareLog(share_id)
        }, 2000)
      }
    })
  },
  flushAward: function() {
    let self = this
    // 获取分享配置、奖励信息、以及分享码
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/share/info',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          app.globalData.shareInfo = res.data.shareInfo || {}
          app.globalData.awardRecords = res.data.award_records || []
          let records = []
          if (app.globalData.awardRecords && app.globalData.awardRecords instanceof Array) {
            records = app.globalData.awardRecords.slice((self.data.page - 1) * 5, self.data.page * 5)
          }
          self.setData({ shareInfo: app.globalData.shareInfo, awardRecords: records })
        } else {
          utils.debug('调用接口失败--/api/share/info：' + JSON.stringify(res))
          self.showToast('获取奖励信息失败', 'bottom')
        }
      },
      fail: err => {
        utils.debug('调用接口失败--/api/share/info：' + JSON.stringify(err))
        self.showToast('获取奖励信息失败', 'bottom')
        // 自动重新尝试
        setTimeout(function() {
          self.flushAward()
        }, 2000)
      }
    })
  },
  // 查看更多奖励
  lookMore: function() {
    let self = this
    let page = self.data.page
    if (page * 5 <= app.globalData.awardRecords.length) {
      page++
      self.setData({
        awardRecords: self.data.awardRecords.concat(app.globalData.awardRecords.slice((page - 1) * 5, page * 5)),
        page: page,
        hasMore: page * 5 < app.globalData.awardRecords.length
      })
    } else {
      self.setData({ hasMore: false })
    }
  },
  // 分享逻辑
  onShareAppMessage: function(res) {
    let self = this
    // 获取分享出去的图片地址
    const shareParams = app.globalData.globalSetting.share
    const now = new Date()
    const code = app.globalData.shareCode + '_' + now.getTime()
    if (shareParams && app.globalData.shareCode) {
      return {
        title: shareParams.title,
        path: shareParams.page + '?code=' + code,
        imageUrl: shareParams.imageUrl
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
  // 分享弹窗点击取消
  handleShareModalClose() {
    this.setData({
      modal: {
        show: false,
        name: '',
        inputValue: '',
        title: '温馨提示',
        opacity: 0.6,
        position: 'center',
        width: '80%',
        options: {
          fullscreen: false,
          showclose: true,
          showfooter: true,
          closeonclickmodal: true,
          confirmText: ''
        }
      }
    })
  },
  // 分享弹窗点击确定，保存图片到本地
  handleShareModalConfirm: function() {
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
              self.handleShareModalClose()
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
    if (app.globalData.shareCode) {
      if (self.data.wxcode) {
        self.setData({
          modal: {
            show: true,
            title: '温馨提示',
            content: '',
            opacity: 0.6,
            position: 'center',
            width: '80%',
            options: {
              fullscreen: false,
              showclose: true,
              showfooter: true,
              closeonclickmodal: true,
              confirmText: '下载二维码'
            }
          }
        })
      } else {
        wx.showLoading({ title: '正在生成二维码' })
        wx.request({
          url: config.base_url + '/api/get_share_img?share_type=friendQ&share_id=' + app.globalData.shareCode + '_' + now.getTime(),
          header: { Authorization: 'Bearer ' + app.globalData.token },
          success: res => {
            if (res.data.ok) {
              self.setData({ wxcode: res.data.img_url })
              self.closeSharePanel()
              setTimeout(function() {
                wx.hideLoading()
                self.setData({
                  modal: {
                    show: true,
                    title: '温馨提示',
                    content: '',
                    opacity: 0.6,
                    position: 'center',
                    width: '80%',
                    options: {
                      fullscreen: false,
                      showclose: true,
                      showfooter: true,
                      closeonclickmodal: true,
                      confirmText: '下载二维码'
                    }
                  }
                })
              }, 1000)
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
      }
    } else {
      self.showToast('获取邀请码失败', 'bottom')
    }
  },
  openShare(event) {
    if (event.currentTarget.dataset.type === 'friend') {
      this.closeSharePanel()
      wx.showShareMenu({
        withShareTicket: false
      })
    } else if (event.currentTarget.dataset.type === 'friendQ') {
      this.getWxCode()
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
