//app.js
const config = require('./config')
const utils = require('./utils/util')

App({
  onLaunch: function () {
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
    this.doLogin()
    this.getShareParams()
  },
  doLogin: () => {
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
              } else if (!res.data.ok && res.data.registe === false) {
                // 未注册
                wx.login({
                  success: res => {
                    let code = res.code
                    if (res.code) {
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
                              } else {
                                wx.showToast({ title: res.data.msg ? res.data.msg : '注册失败', image: '/static/img/close.png' })
                                setTimeout(function(){
                                  wx.hideToast()
                                }, 2000)
                              }
                            },
                            fail: err => {
                              wx.showToast({ title: '注册失败', image: '/static/img/close.png' })
                              setTimeout(function(){
                                wx.hideToast()
                              }, 2000)
                            }
                          })
                        }
                      })
                    }
                  },
                  fail: err => {
                    wx.showToast({ title: '注册失败', image: '/static/img/close.png' })
                    setTimeout(function(){
                      wx.hideToast()
                    }, 2000)
                  }
                })
              } else {
                wx.showToast({ title: '登录失败', image: '/static/img/close.png' })
                setTimeout(function(){
                  wx.hideToast()
                }, 2000)
              }
            },
            fail: err => {
              wx.showToast({ title: '登录失败', image: '/static/img/close.png' })
              setTimeout(function(){
                wx.hideToast()
              }, 2000)
            }
          })
        } else {
          wx.showToast({ title: '登录失败', image: '/static/img/close.png' })
          setTimeout(function(){
            wx.hideToast()
          }, 2000)
        }
      }
    })
  },
  // app加载的时候获取分享配置化参数
  getShareParams: () => {
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/get_setting_items?items=share',
      success: res => {
        if (res.data.ok) {
          try {
            if (typeof res.data.items.share === 'string') {
              res.data.items.share = JSON.parse(res.data.items.share)
            }
            wx.setStorageSync('share_params', {
              title: res.data.items.share.title,
              imageUrl: res.data.items.share.imageUrl,
              path: res.data.items.share.page,
            })
          } catch (err) {
            // error handler
          }
        }
      }
    })
  },
  // 获取分享ID
  fetchShareId: function() {
    let self = this
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/share/new?source=0',
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      success: res => {
        if (res.data.ok) {
          wx.setStorageSync('share_id', res.data.share_id)
        }
      }
    })
  },
  updateShareLog: function(share_id) {
    let self = this
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/share/update?share_id=' + share_id,
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      success: res => {
        if (res.data.ok) {
          wx.showToast({ title: '获得15书币的奖励', icon: 'success' })
          setTimeout(function(){
            wx.hideToast()
          }, 2000)
        }
      }
    })
  },
  globalData: {
    userInfo: null,
    allbooks: []
  }
})
