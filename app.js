//app.js
const config = require('./config')
const utils = require('./utils/util')
const Promise = require('./utils/bluebird.min')

App({
  onLaunch: function() {
    if (typeof wx.getUpdateManager === 'function') {
      // 处理版本更新的动作
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(function(res) {
        // 请求完新版本信息的回调
        console.log(res.hasUpdate ? '有新版本' : '暂无新版本')
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function() {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: function(res) {
                if (res.confirm) {
                  // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                  updateManager.applyUpdate()
                }
              }
            })
          })
        }
      })
      updateManager.onUpdateFailed(function() {
        // 新的版本下载失败
        wx.showModal({
          title: '更新提示',
          content: '新版本下载失败，请检查您的网络',
          showCancel: false
        })
      })
    } else {
      console.log('getUpdateManager不支持')
      wx.showModal({
        title: '更新提示',
        content: '你的微信当前版本太低，无法完成书城更新，请重启微信来获取最新版本',
        showCancel: false
      })
    }
  },
  // 前端向后端提交formId
  reportFormId: function(type, formId, bookId) {
    let self = this
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/upload_formid?type=' + type + '&formId=' + formId + '&bookId=' + (bookId || ''),
      header: { Authorization: 'Bearer ' + self.globalData.token },
      success: function(res) {
        if (!res.data.ok) {
          utils.debug('提交formId失败', res)
        }
      },
      fail: function(err) {
        console.warn(err)
        utils.debug('提交formId失败', err)
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
    utils.debug('小程序错误', error)
  },
  globalData: {
    token: '',
    userInfo: {}, // 用户基本信息
    shareInfo: {}, // 分享信息
    shareCode: '', // 邀请码
    globalSetting: {},
    showReaderTips: false
  }
})
