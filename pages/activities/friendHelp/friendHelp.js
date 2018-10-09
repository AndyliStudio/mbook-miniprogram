// pages/user/user.js
const config = require('../../../config')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    loading: true,
    page: 1,
    limit: 10,
    total: 0,
    loadFail: false,
    lists: [],
    currentFhcode: ''
  },
  onLoad() {
    this.getFriendHelpBook()
  },
  // 分享逻辑
  onShareAppMessage: function(res) {
    let self = this
    // 查询获取当前书籍的助力ID
    return new Promise((resolve, reject) => {
      let self = this
      // 获取当前书籍的助力ID
      wx.request({
        method: 'POST',
        url: config.base_url + '/api/friend_help',
        header: { Authorization: 'Bearer ' + app.globalData.token },
        data: {
          fhbid: res.target.dataset.fhbid,
          source: 'activity'
        },
        success: function(response) {
          if (response.data.ok) {
            resolve({
              title: '好友助力',
              path: 'pages/invite/invite' + '?fhcode=' + response.data.fhcode,
              imageUrl: 'https://fs.andylistudio.com/1537973910409.jpeg'
            })
          } else {
            self.showToast('获取分享参数失败', 'bottom')
            reject(false)
          }
        },
        fail: function(error) {
          console.warn(error)
          self.showToast('获取分享参数失败', 'bottom')
          reject(false)
        }
      })
    })
  },
  getFriendHelpBook() {
    let self = this
    self.setData({ loading: true, loadFail: false })
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/friend_help_book/list?page=' + self.data.page + '&limit=' + self.data.limit,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({ lists: res.data.list, total: res.data.total, loading: false, loadFail: false })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../../loading/loading?need_login_again=1'
          })
        } else {
          self.setData({ loading: false, loadFail: true })
          utils.debug('调用接口失败--/api/friend_help_book/list' + JSON.stringify(res))
        }
      },
      fail: err => {
        self.setData({ loading: false, loadFail: true })
        utils.debug('调用接口失败--/api/friend_help_book/list' + JSON.stringify(err))
      }
    })
  },
  // 加载更多助力书籍
  loadMoreData() {
    let self = this
    // 判断是否还有更多数据
    if (self.data.lists.length >= self.data.total) {
      return false
    }
    self.setData({ page: self.data.page + 1 })
    // 展示loading
    wx.showLoading()
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/friend_help_book/list?page=' + self.data.page + '&limit=' + self.data.limit,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({ lists: self.data.lists.concat(res.data.list) })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('获取助力书籍失败', 'bottom')
          utils.debug('调用接口失败--/api/friend_help_book/list' + JSON.stringify(res))
        }
        wx.hideLoading()
      },
      fail: err => {
        self.showToast('获取助力书籍失败', 'bottom')
        wx.hideLoading()
        utils.debug('调用接口失败--/api/friend_help_book/list' + JSON.stringify(err))
      }
    })
  },
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  },
  openShare: function(event) {
    let self = this
    // 获取当前书籍的助力ID
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/friend_help',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        fhbid: event.currentTarget.dataset.fhbid,
        source: 'activity'
      },
      success: function(res) {
        if (res.data.ok) {
          self.setData({ currentFhcode: res.data.fhcode })
          wx.showShareMenu({
            withShareTicket: false
          })
          console.log('分享成功')
        } else {
          self.showToast('获取分享参数失败', 'bottom')
        }
      },
      fail: function(err) {
        console.warn(err)
        self.showToast('获取分享参数失败', 'bottom')
      }
    })
  }
})
