//booklist.js
const config = require('../../config')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    spriteArr: [],
    myBooks: [],
    lock: false, // 区分点击事件和长按事件
    removing: false // 是否处于删除书籍的状态
  },
  onShow: function() {
    this.getMyBookList()
  },
  getMyBookList: function() {
    let self = this
    wx.request({
      url: config.base_url + '/api/booklist/mylist',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({ myBooks: res.data.list })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('获取我的书单失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取我的书单失败', 'bottom')
      }
    })
  },
  bookClick: function(event) {
    //检查锁
    if (this.data.lock) {
      return
    }
    if (this.data.removing) {
      this.setData({ removing: false })
      return
    }
    const formId = event.detail.formId
    app.reportFormId(formId)
    wx.navigateTo({ url: '../reader/reader?bookid=' + event.target.dataset.bookid })
  },
  bookLongClick: function() {
    let self = this
    //锁住
    self.setData({ lock: true, removing: true })
    setTimeout(function() {
      self.setData({ lock: false })
    }, 500)
  },
  removeBook: function(event) {
    let self = this
    let bookid = event.currentTarget.dataset.bookid
    wx.request({
      url: config.base_url + '/api/booklist/remove_book?id=' + bookid,
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      success: function(res) {
        if (res.data.ok) {
          self.setData({
            myBooks: self.data.myBooks.filter(item => {
              return item.bookid !== bookid
            })
          })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast(res.data.msg || '从书架中移除失败，请重新尝试~', 'bottom')
        }
      },
      fail: function(err) {
        self.showToast('从书架中移除失败，请重新尝试~', 'bottom')
      }
    })
  },
  onHide: function() {
    //还原 removing状态
    this.setData({ removing: false })
  },
  gotoShop: function() {
    wx.navigateTo({ url: '/pages/search/search' })
  },
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
