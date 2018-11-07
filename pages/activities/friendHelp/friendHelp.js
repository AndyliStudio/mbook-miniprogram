// pages/user/user.js
const config = require('../../../config')
const utils = require('../../../utils/util')
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
    loading: true,
    page: 1,
    limit: 10,
    total: 0,
    loadFail: false,
    lists: [],
    currentFhcode: '',
    shareParam: {},
    shareFhCode: {}
  },
  onLoad() {
    this.getFriendHelpBook()
  },
  // 分享逻辑
  onShareAppMessage: function(res) {
    // 关闭modal
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
    return this.data.shareParam
  },
  openShare(event) {
    let self = this
    // 获取当前书籍的助力ID
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/friend_help',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        fhbid: event.target.dataset.fhbid,
        source: 'activity'
      },
      success: function(response) {
        if (response.data.ok) {
          const setting = app.globalData.globalSetting.friend_help_share
          let title = setting.title
          if (title.indexOf('{need_num}') > -1) {
            title = title.replace('{need_num}', response.data.need_num)
          }
          if (title.indexOf('{name}') > -1) {
            title = title.replace('{name}', response.data.name || '')
          }
          if (setting) {
            self.setData({
              shareFhCode: response.data.fhcode,
              shareParam: {
                title: title,
                path: setting.page + '?fhcode=' + response.data.fhcode,
                imageUrl: setting.imageUrl
              },
              modal: {
                show: true,
                name: 'secret',
                title: '温馨提示',
                inputValue: '',
                opacity: 0.6,
                position: 'center',
                width: '80%',
                options: {
                  fullscreen: false,
                  showclose: true,
                  showfooter: false,
                  closeonclickmodal: true,
                  confirmText: ''
                }
              }
            })
            // 更新列表
            for (let i = 0; i < self.data.lists.length; i++) {
              if (self.data.lists[i]._id === event.target.dataset.fhbid && typeof self.data.lists[i].left_num === 'undefined') {
                self.data.lists[i].left_num = response.data.need_num
                break
              }
            }
          } else {
            self.showToast('获取分享参数失败', 'bottom')
          }
        } else {
          utils.debug('获取助力参数失败', res)
          self.showToast('获取分享参数失败', 'bottom')
        }
      },
      fail: function(err) {
        console.warn(err)
        utils.debug('获取助力参数失败', err)
        self.showToast('获取分享参数失败', 'bottom')
        reject(false)
      }
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
          utils.debug('获取助力书籍失败', res)
        }
      },
      fail: err => {
        self.setData({ loading: false, loadFail: true })
        utils.debug('获取助力书籍失败', err)
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
        wx.hideLoading()
        if (res.data.ok) {
          self.setData({ lists: self.data.lists.concat(res.data.list) })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('获取助力书籍失败', 'bottom')
          utils.debug('获取助力书籍失败', res)
        }
      },
      fail: err => {
        wx.hideLoading()
        self.showToast('获取助力书籍失败', 'bottom')
        utils.debug('获取助力书籍失败', err)
      }
    })
  },
  gotoRead: function(event) {
    wx.navigateTo({
      url: '../../bookdetail/bookdetail?id=' + event.currentTarget.dataset.bookid
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
