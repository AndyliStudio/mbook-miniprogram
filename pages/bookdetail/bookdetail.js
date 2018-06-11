//bookdetail.js
const config = require('../../config')
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
    wxcode: '',
    detail: {},
    isInList: false,
    bookid: '',
    showAllDes: false,
    goodInfo: '',
    comments: [],
    commentInputHide: true,
    commentType: null, // 评论类型，是回复别人还是评论书籍
    currentCommentValue: '',
    secretTips: '',
    hasUnLock: true // 用户是否已经解锁过改章节
  },
  onShow: function() {
    wx.showNavigationBarLoading()
    this.getBookDetail(this.data.bookid)
    this.getCommentList(this.data.bookid)
    this.setData({ bookid: this.data.bookid })
  },
  onLoad: function(options) {
    let globalSetting = wx.getStorageSync('global_setting')
    let secretTips = globalSetting.secret_tips || '请联系客服，在支付2-3元后，客服人员会发送给你一个串阅读秘钥用来解锁整本书。'
    this.setData({ bookid: options.id, wxcode: globalSetting.wxcode || 'haitianyise_hl', secretTips: secretTips })
  },
  getBookDetail: function(id) {
    let self = this
    if (id) {
      wx.request({
        url: config.base_url + '/api/book/get_detail?id=' + id,
        header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
        success: function(res) {
          if (res.data.ok) {
            // devide des into shortDes and des;
            let shortDes = ''
            // format des
            let des = res.data.data.des.replace(/[\n\r\s]+/, '')
            res.data.data.des = des.replace(/( ){2,}/, ' ')
            if (des.length > 95) {
              shortDes = des.substring(0, 70) + '...'
            }
            res.data.data.shortDes = shortDes
            let goodInfo = ''
            if (res.data.data.good.type === 'free') {
              goodInfo = '全书免费'
            } else if (res.data.data.good.type === 'normal') {
              goodInfo = '每章需要 ' + res.data.data.good.prise + ' 书币'
            } else if (res.data.data.good.type === 'limit_chapter') {
              goodInfo = '前' + res.data.data.good['limit_chapter'] + '免费，后续章节每章 ' + res.data.data.good.prise + ' 书币'
            } else if (res.data.data.good.type === 'limit_date') {
              goodInfo = res.data.data.good['limit_start_date'] + ' 至 ' + res.data.data.good['limit_end_date'] + '免费，后续章节每章 ' + res.data.data.good.prise + ' 书币'
            } else {
              goodInfo = '全书免费'
            }
            // 如果当前书籍没在书架中，自动加入书架
            self.setData({ detail: res.data.data, isInList: res.data.isInList, goodInfo: goodInfo, hasUnLock: res.data.data.hasUnLock })
            if (!res.data.isInList) {
              self.addOrRemove()
            }
            wx.setNavigationBarTitle({ title: res.data.data.name })
            wx.hideNavigationBarLoading()
          } else if (res.data.authfail) {
            wx.navigateTo({
              url: '../authfail/authfail'
            })
          } else {
            self.showToast('获取书籍信息失败~', 'bottom')
          }
        },
        fail: function(err) {
          self.showToast('获取书籍信息失败~', 'bottom')
        }
      })
    } else {
      self.showToast('获取书籍信息失败~', 'bottom')
    }
  },
  getCommentList: function(id) {
    let self = this
    if (id) {
      wx.request({
        url: config.base_url + '/api/comment/list?bookid=' + id,
        header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
        success: res => {
          if (res.data.ok) {
            res.data.list = res.data.list.map(item => {
              item.isOpenMoreComment = false
              return item
            })
            self.setData({ comments: res.data.list })
          } else if (res.data.authfail) {
            wx.navigateTo({
              url: '../authfail/authfail'
            })
          } else {
            self.showToast(res.data.msg || '获取评论失败~', 'bottom')
          }
        },
        fail: err => {
          self.showToast('获取评论失败~', 'bottom')
        }
      })
    }
  },
  showAllDes: function() {
    if (this.data.detail.shortDes) {
      if (this.data.showAllDes) {
        this.setData({ showAllDes: false })
      } else {
        this.setData({ showAllDes: true })
      }
    }
  },
  // 输入秘钥解锁
  openSecret: function() {
    this.setData({
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
  },
  // 打开复制客服微信的弹窗
  openContact: function() {
    this.setData({
      'modal.name': 'contact'
    })
  },
  // 我已有秘钥
  hasSecret: function() {
    this.setData({
      'modal.title': '请输入秘钥',
      'modal.name': 'input'
    })
  },
  bindKeyInput: function(e) {
    this.setData({
      'modal.inputValue': e.detail.value
    })
  },
  // 完成秘钥输入
  finishSecretInput: function() {
    let self = this
    if (!self.data.modal.inputValue) {
      self.showToast('请输入秘钥', 'bottom')
      return false
    }
    wx.request({
      url: config.base_url + '/api/secret/open?bookid=' + self.data.bookid + '&secret=' + self.data.modal.inputValue,
      header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
      success: res => {
        if (res.data.ok) {
          // 隐藏购买提示
          self.setData({
            'modal.show': false,
            'hasUnLock': true
          })
          wx.showToast({ title: '解锁成功', icon: 'success' })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../authfail/authfail'
          })
        } else {
          self.showToast('解锁失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        self.showToast('解锁失败，请重试', 'bottom')
      }
    })
  },
  // 复制微信号
  copyWxcode: function() {
    let self = this
    wx.setClipboardData({
      data: self.data.wxcode,
      success: function(res) {
        wx.showToast({ title: '复制成功', icon: 'success' })
        self.setData({
          'modal.show': false
        })
        setTimeout(function() {
          wx.hideToast()
        }, 2000)
      }
    })
  },
  addOrRemove: function() {
    let self = this
    if (self.data.isInList) {
      wx.request({
        url: config.base_url + '/api/booklist/remove_book?id=' + self.data.bookid,
        header: {
          Authorization: 'Bearer ' + wx.getStorageSync('token')
        },
        success: function(res) {
          if (res.data.ok) {
            // self.showToast('从书架中移除成功', 'bottom')
            self.setData({ isInList: false })
          } else if (res.data.authfail) {
            wx.navigateTo({
              url: '../authfail/authfail'
            })
          } else {
            self.showToast(res.data.msg || '从书架中移除失败，请重新尝试~', 'bottom')
          }
        },
        fail: function(err) {
          self.showToast('从书架中移除失败，请重新尝试~', 'bottom')
        }
      })
    } else {
      wx.request({
        url: config.base_url + '/api/booklist/add_book?id=' + self.data.bookid,
        header: {
          Authorization: 'Bearer ' + wx.getStorageSync('token')
        },
        success: function(res) {
          if (res.data.ok) {
            // wx.showToast({ title: '加入书架成功', icon: 'success' })
            self.setData({ isInList: true })
          } else if (res.data.authfail) {
            wx.navigateTo({
              url: '../authfail/authfail'
            })
          } else {
            self.showToast(res.data.msg || '加入书架失败，请重新尝试~', 'bottom')
          }
        },
        fail: function(err) {
          self.showToast('加入书架失败，请重新尝试~', 'bottom')
        }
      })
    }
  },
  addLikeNum: function(event) {
    let self = this
    let commentid = event.currentTarget.dataset.commentid
    let index = event.currentTarget.dataset.index
    wx.request({
      url: config.base_url + '/api/comment/like?commentid=' + commentid + '&op=' + (self.data.comments[index].is_like ? 'remove' : 'add'),
      header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
      success: res => {
        if (res.data.ok) {
          let key1 = 'comments[' + index + '].like_num'
          let key2 = 'comments[' + index + '].is_like'
          self.setData({ [key1]: res.data.current, [key2]: self.data.comments[index].is_like ? false : true })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../authfail/authfail'
          })
        } else {
          self.showToast(res.data.msg || '点赞失败~', 'bottom')
        }
      },
      fail: err => {
        self.showToast(res.data.msg || '点赞失败~', 'bottom')
      }
    })
  },
  readMoreComments: function(event) {
    let self = this
    let commentid = event.currentTarget.dataset.commentid
    let index = event.currentTarget.dataset.index
    let key = 'comments[' + index + '].isOpenMoreComment'
    self.setData({ [key]: !self.data.comments[index].isOpenMoreComment })
  },
  toWriteComment: function(event) {
    let self = this
    if (event.currentTarget.id == 'write') {
      self.setData({ commentInputHide: false, commentType: null })
    } else {
      const commentid = event.currentTarget.dataset.commentid
      const username = event.currentTarget.dataset.username
      const storeUsername = (wx.getStorageSync('userinfo') || {}).username
      if (storeUsername === username) {
        self.showToast('自己不能回复自己', 'bottom')
      } else {
        self.setData({ commentInputHide: false, commentType: { id: commentid, username: username } })
      }
    }
  },
  hideCommentBar: function() {
    this.setData({ commentInputHide: true })
  },
  stageCommentValue: function(e) {
    this.setData({ currentCommentValue: e.detail.value })
  },
  sendComment: function(event) {
    let self = this
    let content = event.detail.value
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/comment/add',
      header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
      data: {
        bookid: self.data.bookid,
        content: content,
        father: self.data.commentType ? self.data.commentType.id : ''
      },
      success: res => {
        if (res.data.ok) {
          wx.showToast({ title: '发布书评成功', icon: 'success' })
          let comments = self.data.comments
          comments.unshift(res.data.data)
          // 清空当前评论内容，重新加载comment
          self.setData({ currentCommentValue: '' })
          self.getCommentList(self.data.bookid)
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../authfail/authfail'
          })
        } else {
          self.showToast(res.data.msg || '发布书评失败~', 'bottom')
        }
      },
      fail: err => {
        self.showToast('发布书评失败~', 'bottom')
      }
    })
  },
  goToReader: function() {
    wx.navigateTo({ url: '../reader/reader?bookid=' + this.data.bookid })
  },
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
