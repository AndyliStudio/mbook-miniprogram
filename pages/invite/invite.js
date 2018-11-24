// pages/user/user.js
const config = require('../../config')
const utils = require('../../utils/util')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    fhcode: '', // 好友助力分享ID
    info: {
      success: false,
      has_finished: 0,
      create_time: new Date(),
      left_time: '00 天 00 小时 00 分',
      book: {
        id: '',
        need_num: 0,
        limit_time: 1,
        name: '',
        author: '',
        img_url: ''
      },
      user: {
        username: '某某',
        avatar: ''
      }
    },
    recordLoading: false,
    showRecords: false,
    finishHelpIt: false,
    isSelf: false,
    records: [] // 好友助力记录
  },
  onLoad: function(options) {
    this.setData({
      fhcode: options.fhcode || '',
      currentUserId: app.globalData.userInfo._id
    })
    this.getFriendHelpInfo()
  },
  // 分享逻辑
  onShareAppMessage: function() {
    let self = this
    // 获取分享出去的图片地址
    const shareParams = app.globalData.globalSetting.friend_help_share
    let title = shareParams.title
    if (title.indexOf('{need_num}') > -1) {
      title = title.replace('{need_num}', self.data.info.book.need_num)
    }
    if (title.indexOf('{name}') > -1) {
      title = title.replace('{name}', self.data.info.book.name)
    }
    if (shareParams) {
      return {
        title: title,
        path: shareParams.page + '?fhcode=' + self.data.fhcode,
        imageUrl: shareParams.imageUrl
      }
    } else {
      self.showToast('获取分享参数失败', 'bottom')
      return false
    }
  },
  getFriendHelpInfo: function() {
    let self = this
    // 获取当前书籍的助力ID
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/friend_help/info',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        fhcode: self.data.fhcode
      },
      success: function(res) {
        if (res.data.ok) {
          res.data.data.half_num = Math.ceil(res.data.data.book.need_num / 2)
          res.data.data.present = parseInt((res.data.data.has_finished * 100) / res.data.data.book.need_num) + '%'
          if (res.data.data.success) {
            res.data.data.status = 1
          } else {
            let now = new Date()
            let limitTime = res.data.data.book.limit_time > 0 ? parseInt(res.data.data.book.limit_time) : 0
            let endDate = new Date(res.data.data.create_time + limitTime * 24 * 60 * 60 * 1000)
            if (now.getTime() > endDate.getTime()) {
              res.data.data.status = 2
            } else {
              res.data.data.status = 3
            }
          }
          let isSelf = false
          if (app.globalData.userInfo._id === res.data.data.userid) {
            isSelf = true
          } 
          self.setData({ info: res.data.data, isSelf: isSelf })
        } else {
          utils.debug('获取好友助力信息失败', res)
          self.showToast('获取好友助力信息失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: function(err) {
        console.warn(err)
        utils.debug('获取好友助力信息失败', err)
        self.showToast('获取好友助力信息失败', 'bottom')
      }
    })
  },
  // 查看助力详情
  lookRecords() {
    let self = this
    self.setData({ recordLoading: true })
    // 获取好友助力记录
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/friend_help/records',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        fhcode: self.data.fhcode
      },
      success: function(res) {
        if (res.data.ok) {
          let colors = ['#3fb8af', '#7fc7af', '#ffd188', '#ff9e9d', '#bf6374']
          for (let i = 0; i < res.data.lists.length; i++) {
            res.data.lists[i].color = colors[i % 5]
          }
          if (res.data.lists.length <= 4) {
            let length = 5 - res.data.lists.length
            for (let j = 0; j < length; j++) {
              res.data.lists.push({
                color: colors[(res.data.lists.length + j) % 5]
              })
            }
          }
          self.setData({ records: res.data.lists, recordLoading: false, showRecords: true })
        } else {
          self.setData({ recordLoading: false, showRecords: false })
          utils.debug('获取好友助力信息失败', res)
          self.showToast('获取好友助力记录失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: function(err) {
        console.warn(err)
        self.setData({ recordLoading: false, showRecords: false })
        utils.debug('获取好友助力信息失败', err)
        self.showToast('获取好友助力记录失败', 'bottom')
      }
    })
  },
  // 关闭弹窗
  closeDialog() {
    this.setData({ showRecords: false })
  },
  // 帮他助力
  helpIt() {
    let self = this
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/friend_help/accept',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        fhcode: self.data.fhcode
      },
      success: function(res) {
        console.log(res)
        if (res.data.ok) {
          self.getFriendHelpInfo()
          self.setData({ finishHelpIt: true })
          wx.showToast({ title: '助力成功', icon: 'success' })
        } else {
          utils.debug('助力失败', res)
          self.showToast('助力失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: function(err) {
        console.warn(err)
        utils.debug('助力失败', err)
        self.showToast('助力失败', 'bottom')
      }
    })
  },
  gotoIndex: function() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
  gotoReader: function() {
    wx.navigateTo({
      url: '/pages/bookdetail/bookdetail?id=' + this.data.info.book.id
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
