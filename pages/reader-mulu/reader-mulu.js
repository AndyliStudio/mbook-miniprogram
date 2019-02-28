// pages/user/user.js
const config = require('../../config')
const app = getApp()

Page({
  data: {
    loading: true,
    nextLoading: true,
    hasMore: true,
    datas: [],
    keyword: '',
    searching: false,
    searchDatas: []
  },
  other: {
    bookid: '',
    page: 1,
    limit: 50,
    scrollTopValue: 0
  },
  onLoad: function(options) {
    if (!options.bookid) {
      wx.showToast({ title: '页面参数错误', icon: 'none', duration: 2000 })
      wx.navigateBack({ delta: 1 })
      return false
    }
    wx.setNavigationBarTitle({ title: options.name || '章节目录' })
    this.other.bookid = options.bookid
    // 获取章节
    this.getMulu()
  },
   // 即将滑动到底部的回调函数，用来加载剩下的章节
  onReachBottom: function() {
    console.log('加载下一章')
    if (this.data.nextLoading || !this.data.hasMore || this.data.searching) {
      return false
    }
    this.getMulu(true)
  },
  getMulu: function(isNext) {
    if (isNext) {
      this.other.page += 1
    }
    this.setData({ nextLoading: true })
    wx.request({
      url: config.base_url + '/api/chapter/list?bookid=' + this.other.bookid + '&pageid=' + this.other.page + '&limit=' + this.other.limit,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        this.setData({ nextLoading: false })
        if (res.data.ok) {
          if (this.data.loading) {
            this.setData({ datas: this.data.datas.concat(res.data.list), loading: false, hasMore: this.other.page * this.other.limit < res.data.total })
          } else {
            this.setData({ datas: this.data.datas.concat(res.data.list), hasMore: this.other.page * this.other.limit < res.data.total })
          }
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (utils.getCurrentPageUrlWithArgs().indexOf('/loading/loading?need_login_again=1') < 0) {
            wx.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          } else {
            if (isNext) this.other.page -= 1
          }
        } else {
          if (isNext) this.other.page -= 1
          wx.showToast({ title: '加载书籍章节失败', icon: 'none', duration: 2000 })
        }
      },
      fail: err => {
        this.setData({ nextLoading: false })
        if (isNext) this.other.page -= 1
        wx.showToast({ title: '加载书籍章节失败', icon: 'none', duration: 2000 })
      }
    })
  },
  searchChapter: function(event) {
    // 禁止关键字为空的搜索
    if (!event.detail.value) {
      return false
    }
    let query = wx.createSelectorQuery()
    query.selectViewport().scrollOffset()
    query.exec(res => {
      this.other.scrollTopValue = res[0].scrollTop
    })
    wx.request({
      url: config.base_url + '/api/chapter/search?bookid=' + this.other.bookid + '&str=' + event.detail.value,
      success: res => {
        if (res.data.ok) {
          this.setData({ searchDatas: res.data.data, searching: true })
          wx.pageScrollTo({ scrollTop: 0, duration: 0 })
        } else {
          wx.showToast({ title: '未找到相应章节', icon: 'none', duration: 2000 })
        }
      },
      fail: err => {
        wx.showToast({ title: '未找到相应章节', icon: 'none', duration: 2000 })
      }
    })
  },
  //事件处理函数
  closeSearch: function() {
    wx.navigateBack()
  },
  clearKeyword: function() {
    this.setData({
      keyword: '',
      searching: false
    })
    setTimeout(() => {
      wx.pageScrollTo({ scrollTop: this.other.scrollTopValue, duration: 0 })
    }, 100)
  },
  gotoReader: function(event) {
    wx.navigateTo({ url: '../reader-new/reader-new?bookid=' + this.other.bookid + '&chapterid=' + event.currentTarget.dataset.id })
  }
})
