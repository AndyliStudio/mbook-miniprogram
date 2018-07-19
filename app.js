//app.js
const config = require('./config')
const utils = require('./utils/util')
const Promise = require('./utils/bluebird.min')

App({
  // 前端向后端提交formId
  reportFormId: function(formId) {
    let self = this
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/upload_formid?formId=' + formId,
      header: { Authorization: 'Bearer ' + self.globalData.token },
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
    token: '',
    userInfo: {}, // 用户基本信息
    allbooks: [], // 阅读记录
    shareInfo: {}, // 分享信息
    shareCode: '', // 邀请码
    hasLogined: false,
    hasGotShareInfo: false,
    allbooks: []
  }
})
