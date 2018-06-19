//app.js
const config = require('./config')
const utils = require('./utils/util')
const Promise = require('./utils/bluebird.min')

App({
  onLaunch: function() {
    // wx.checkSession({
    //   success: function(){
    //     //session 未过期，并且在本生命周期一直有效
    //     self.globalData.token = wx.getStorageSync('token')
    //   },
    //   fail: function(){
    //     //登录态过期
    //     self.doLogin() //重新登录
    //   }
    // })
    let self = this
    this.doLogin().then(res => {
      if (res === true) {
        self.globalData.hasLogined = true
        self.getShareInfo().then(res2 => {
          if (res2 === true) {
            self.globalData.hasGotShareInfo = true
          }
        })
      }
    })
    this.getGlobalSetting()
  },
  doLogin: () => {
    return new Promise((resolve, reject) => {
      // 微信登录
      wx.login({
        success: res => {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          let code = res.code
          if (code) {
            wx.request({
              method: 'POST',
              url: config.base_url + '/api/user/login',
              data: {
                identity: 1,
                code: code
              },
              success: res => {
                if (res.data.ok) {
                  // 将token存入缓存，在每次发送需要认证的请求时在header里带上token
                  wx.setStorageSync('token', res.data.token)
                  wx.setStorageSync('userinfo', res.data.userinfo)
                  wx.setStorageSync('allbooks', res.data.allbooks)
                  resolve(true)
                } else if (!res.data.ok && res.data.registe === false) {
                  // 未注册
                  wx.login({
                    success: res => {
                      let code = res.code
                      if (res.code) {
                        wx.getSetting({
                          success: res => {
                            console.log(res)
                          }
                        })
                        // 获取用户信息后，发送registe请求
                        wx.getUserInfo({
                          success: res => {
                            // 可以将 res 发送给后台解码出 unionId
                            wx.request({
                              method: 'POST',
                              url: config.base_url + '/api/user/registe',
                              data: Object.assign({ identity: 'appuser', code: code }, res.userInfo),
                              success: res => {
                                if (res.data.ok) {
                                  wx.setStorageSync('token', res.data.token)
                                  wx.setStorageSync('userinfo', res.data.userinfo)
                                  resolve(true)
                                } else {
                                  reject(false)
                                  wx.showToast({ title: res.data.msg ? res.data.msg : '注册失败', image: '/static/img/close.png' })
                                  setTimeout(function() {
                                    wx.hideToast()
                                  }, 2000)
                                }
                              },
                              fail: err => {
                                reject(err)
                                utils.debug('调用注册接口失败：' + JSON.stringify(err))
                                wx.showToast({ title: '注册失败', image: '/static/img/close.png' })
                                setTimeout(function() {
                                  wx.hideToast()
                                }, 2000)
                              }
                            })
                          },
                          fail: err => {
                            utils.debug('获取用户信息失败：' + JSON.stringify(err))
                            // 用户授权失败，前往重新授权页面
                            let timmer = setInterval(function() {
                              if (getCurrentPages().pop()) {
                                wx.navigateTo({
                                  url: '../authfail/authfail?page=reauth'
                                })
                                clearInterval(timmer)
                              }
                            }, 1000)
                          }
                        })
                      }
                    },
                    fail: err => {
                      reject(err)
                      utils.debug('获取登录信息失败：' + JSON.stringify(err))
                      wx.showToast({ title: '获取登录信息失败', image: '/static/img/close.png' })
                      setTimeout(function() {
                        wx.hideToast()
                      }, 2000)
                    }
                  })
                } else {
                  reject(false)
                  utils.debug('调用登录接口失败：' + JSON.stringify(res))
                  wx.showToast({ title: '登录失败', image: '/static/img/close.png' })
                  setTimeout(function() {
                    wx.hideToast()
                  }, 2000)
                }
              },
              fail: err => {
                reject(err)
                utils.debug('调用登录接口失败：' + JSON.stringify(err))
                wx.showToast({ title: '登录失败', image: '/static/img/close.png' })
                setTimeout(function() {
                  wx.hideToast()
                }, 2000)
              }
            })
          } else {
            reject(false)
            utils.debug('获取微信登录信息失败，code不存在：' + JSON.stringify(err))
            wx.showToast({ title: '登录失败', image: '/static/img/close.png' })
            setTimeout(function() {
              wx.hideToast()
            }, 2000)
          }
        },
        fail: err => {
          reject(err)
          utils.debug('获取微信登录信息失败：' + JSON.stringify(err))
          wx.showToast({ title: '登录失败', image: '/static/img/close.png' })
          setTimeout(function() {
            wx.hideToast()
          }, 2000)
        }
      })
    })
  },
  // 获取分享配置、奖励信息、以及分享码
  getShareInfo: function() {
    return new Promise((resolve, reject) => {
      wx.request({
        method: 'GET',
        url: config.base_url + '/api/share/info',
        header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
        success: res => {
          if (res.data.ok) {
            wx.setStorageSync('share_info', res.data.shareInfo)
            wx.setStorageSync('share_code', res.data.code)
            resolve(true)
          } else {
            resolve(false)
          }
        },
        fail: err => {
          utils.debug('获取分享信息失败：' + JSON.stringify(err))
          reject(err)
        }
      })
    })
  },
  getGlobalSetting: function() {
    wx.showLoading()
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/get_setting_items?items=share|wxcode|index_dialog|charge_tips|secret_tips|shut_check',
      success: res => {
        if (res.data.ok) {
          wx.setStorageSync('share_params', JSON.parse(res.data.items.share))
          wx.setStorageSync('global_setting', {
            wxcode: res.data.items.wxcode,
            index_dialog: res.data.items.index_dialog,
            charge_tips: res.data.items.charge_tips,
            secret_tips: res.data.items.secret_tips,
            shut_check: res.data.items.shut_check === 'true'
          })
          if (res.data.items.shut_check === 'true') {
            // wx.reLaunch({ url: '../shutcheck/shutcheck' })
          } else {
            setTimeout(function() {
              wx.reLaunch({ url: '/pages/index/index' })
            }, 100)
          }
        } else {
          wx.showToast({ title: res.data.msg || '获取应用设置失败', image: './static/img/close.png' })
        }
        wx.hideLoading()
      },
      fail: err => {
        utils.debug('获取全局设置失败：' + JSON.stringify(err))
        wx.showToast({ title: '获取应用设置失败', image: './static/img/close.png' })
        wx.hideLoading()
      }
    })
  },
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
            resolve(res.data.msg)
          }
        },
        fail: err => {
          utils.debug('领取分享奖励失败：' + JSON.stringify(err))
          reject(err)
        }
      })
    })
  },
  // 前端向后端提交formId
  reportFormId: function(formId) {
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/get_setting_items?items=share|wxcode|index_dialog|charge_tips|secret_tips|shut_check',
      success: res => {
        if (res.data.ok) {
          wx.setStorageSync('share_params', JSON.parse(res.data.items.share))
          wx.setStorageSync('global_setting', {
            wxcode: res.data.items.wxcode,
            index_dialog: res.data.items.index_dialog,
            charge_tips: res.data.items.charge_tips,
            secret_tips: res.data.items.secret_tips,
            shut_check: res.data.items.shut_check === 'true'
          })
          if (res.data.items.shut_check === 'true') {
            // wx.reLaunch({ url: '../shutcheck/shutcheck' })
          } else {
            setTimeout(function() {
              wx.reLaunch({ url: '/pages/index/index' })
            }, 100)
          }
        } else {
          wx.showToast({ title: res.data.msg || '获取应用设置失败', image: './static/img/close.png' })
        }
        wx.hideLoading()
      },
      fail: err => {
        utils.debug('获取全局设置失败：' + JSON.stringify(err))
        wx.showToast({ title: '获取应用设置失败', image: './static/img/close.png' })
        wx.hideLoading()
      }
    })
  },
  onError: function(error) {
    utils.debug(error)
  },
  globalData: {
    userInfo: null,
    hasLogined: false,
    hasGotShareInfo: false,
    allbooks: []
  }
})
