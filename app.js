//app.js
const config = require('./config')
const utils = require('./utils/util')
const Promise = require('./utils/bluebird.min')

App({
  updateShareLog: function(share_id, callback) {
    return new Promise((resolve, reject) => {
      wx.request({
        method: 'GET',
        url: config.base_url + '/api/share/update?share_id=' + share_id,
        header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
        success: res => {
          if (res.data.ok) {
            resolve(true)
            wx.showToast({ title: '获得15书币的奖励', icon: 'success' })
            setTimeout(function() {
              wx.hideToast()
            }, 2000)
          } else if (res.data.authfail) {
            wx.navigateTo({
              url: '../authfail/authfail'
            })
          } else {
            resolve(res)
          }
        },
        fail: err => {
          utils.debug('领取分享奖励失败：' + JSON.stringify(err))
          // 自动重新尝试
          this.updateShareLog(share_id, callback)
        }
      })
    })
  },
  // 前端向后端提交formId
  reportFormId: function(formId) {
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/upload_formid?formId=' + formId,
      header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
      success: res => {
        if (!res.data.ok) {
          utils.debug('提交formId失败：' + JSON.stringify(err))
        }
      },
      fail: err => {
        utils.debug('提交formId失败：' + JSON.stringify(err))
        // 自动重新尝试
        this.reportFormId(formId)
      }
    })
  },
  navigateTo: function(page) {
    let self = this
    setTimeout(function() {
      wx.navigateTo({
        url: page,
        fail: err => {
          self.navigateTo(page)
        }
      })
    }, 300)
  },
  onError: function(error) {
    utils.debug(error)
  },
  globalData: {
    code: '',
    userInfo: null,
    hasLogined: false,
    hasGotShareInfo: false,
    allbooks: []
  }
})
