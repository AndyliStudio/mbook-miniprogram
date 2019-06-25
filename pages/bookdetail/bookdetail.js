//bookdetail.js
const config = require('../../config')
const app = getApp()

Page({
  data: {
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
    detail: {},
    isInList: false,
    showAllDes: false,
    goodInfo: '',
    comments: [],
    commentInputHide: true,
    commentType: null, // 评论类型，是回复别人还是评论书籍
    currentCommentValue: '',
    secretTips: '',
    hasUnLock: false, // 用户是否已经解锁过改章节
    shutChargeTips: false, // 是否屏蔽充值提示
    showIndexBtn: '', // 是否展示返回首页按钮
    isShowRss: true,
    hasRssTheBook: false,
    isInShareWhiteList: false // 当前用户是否处于分享白名单里
  },
  other: {
    bookid: '',
    wxcode: '',
    auto_secret: false, // 是否自动解锁书籍
    auto_secret_code: '',
    auto_unlock_code: ''
  },
  onShow: function () {
    let hasRssBookArr = wx.getStorageSync('hasRssBookArr') || []
    if (hasRssBookArr.indexOf(this.other.bookid) > -1) {
      this.setData({
        hasRssTheBook: true
      })
    }
  },
  onLoad: function (options) {
    // 隐藏分享按钮
    wx.hideShareMenu()
    let secretTips =
      app.globalData.globalSetting && app.globalData.globalSetting.secret_tips ? app.globalData.globalSetting.secret_tips : '请联系客服，在支付2-3元后，客服人员会发送给你一串阅读秘钥用来解锁整本书。'
    wx.showNavigationBarLoading()
    this.getBookDetail(options.id)
    this.getCommentList(options.id)
    let isShowRss = true
    let noRssShowArr = wx.getStorageSync('noRssShowArr') || [];
    if (noRssShowArr.indexOf(options.id) > -1) {
      isShowRss = false
    }
    console.log('是否为分享白名单', app.globalData.shareWhiteList)
    this.setData({
      showIndexBtn: options.indexbtn === '1',
      secretTips: secretTips,
      shutChargeTips: app.globalData.globalSetting.shut_charge_tips || false,
      isShowRss: isShowRss,
      isInShareWhiteList: app.globalData.shareWhiteList
    })
    this.other.auto_unlock_code = options.auto_secret
    this.other.bookid = options.id
    this.other.wxcode = app.globalData.globalSetting.wxcode || 'haitianyise_hl'
  },
  // 分享逻辑
  onShareAppMessage: function (res) {
    // 是否是分享白名单里的用户
    const auto_secret = app.globalData.shareWhiteList
    // 获取分享出去的图片地址
    return {
      title: '我正在阅读《' + this.data.detail.name + '》，进来看看吧~',
      path: '/pages/loading/loading?bookid=' + this.other.bookid + (auto_secret && this.other.auto_secret_code ? ('&auto_secret=' + this.other.auto_secret_code) : '')
    }
  },
  getBookDetail: function (id) {
    if (!id) {
      wx.showToast({
        title: '获取书籍信息失败~',
        icon: 'none',
        duration: 2000
      })
      return false
    }
    wx.request({
      url: config.base_url + '/api/book/get_detail?id=' + id,
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      success: res => {
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
          this.setData({
            detail: res.data.data,
            isInList: res.data.isInList,
            goodInfo: goodInfo,
            hasUnLock: res.data.data.hasUnLock,
            hasRssTheBook: !!res.data.data.rss
          })
          if (!res.data.isInList) {
            this.addOrRemove()
          }
          // 如果页面带有auto_secret参数，则帮当前用户自动解锁书籍
          console.log('debug', res.data.data.hasUnLock, this.other.auto_unlock_code)
          if (!res.data.data.hasUnLock && this.other.auto_unlock_code) {
            this.autoUnLockBook()
          }
          wx.setNavigationBarTitle({
            title: res.data.data.name
          })
          wx.hideNavigationBarLoading()
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          wx.showToast({
            title: '获取书籍信息失败~',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        wx.showToast({
          title: '获取书籍信息失败~',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  getCommentList: function (id) {
    if (!id) {
      return false
    }
    wx.request({
      url: config.base_url + '/api/comment/list?bookid=' + id,
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      success: res => {
        if (res.data.ok) {
          res.data.list = res.data.list.map(item => {
            item.isOpenMoreComment = false
            return item
          })
          this.setData({
            comments: res.data.list
          })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          wx.showToast({
            title: res.data.msg || '获取评论失败~',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        wx.showToast({
          title: '获取评论失败~',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  showAllDes: function () {
    if (this.data.detail.shortDes) {
      if (this.data.showAllDes) {
        this.setData({
          showAllDes: false
        })
      } else {
        this.setData({
          showAllDes: true
        })
      }
    }
  },
  // 输入秘钥解锁
  openSecret: function () {
    this.setData({
      modal: {
        show: true,
        name: 'input',
        title: '请输入您的粉丝凭证',
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
  openContact: function () {
    this.setData({
      'modal.name': 'contact'
    })
  },
  // 我已有秘钥
  hasSecret: function () {
    this.setData({
      'modal.title': '请输入您的粉丝凭证',
      'modal.name': 'input'
    })
  },
  bindKeyInput: function (e) {
    this.setData({
      'modal.inputValue': e.detail.value
    })
  },
  // 完成秘钥输入
  finishSecretInput: function () {
    if (!this.data.modal.inputValue) {
      wx.showToast({
        title: '请输入粉丝凭证',
        icon: 'none',
        duration: 2000
      })
      return false
    }
    wx.request({
      url: config.base_url + '/api/secret/open?bookid=' + this.other.bookid + '&secret=' + this.data.modal.inputValue,
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      success: res => {
        if (res.data.ok) {
          // 隐藏购买提示
          this.setData({
            'modal.show': false,
            'hasUnLock': true
          })
          wx.showToast({
            title: '开始阅读吧~',
            icon: 'success'
          })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          wx.showToast({
            title: (res.data.msg || ''),
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        wx.showToast({
          title: '请重试' + (res.data.msg ? '，' + res.data.msg : ''),
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  // 复制微信号
  copyWxcode: function () {
    wx.setClipboardData({
      data: this.data.wxcode,
      success: res => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        })
        this.setData({
          'modal.show': false
        })
        setTimeout(function () {
          wx.hideToast()
        }, 2000)
      }
    })
  },
  addOrRemove: function () {
    if (this.data.isInList) {
      wx.request({
        url: config.base_url + '/api/booklist/remove_book?id=' + this.other.bookid,
        header: {
          Authorization: 'Bearer ' + app.globalData.token
        },
        success: res => {
          if (res.data.ok) {
            this.setData({
              isInList: false
            })
          } else if (res.data.authfail) {
            wx.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          } else {
            wx.showToast({
              title: res.data.msg || '从书架中移除失败，请重新尝试~',
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: function (err) {
          wx.showToast({
            title: '从书架中移除失败，请重新尝试~',
            icon: 'none',
            duration: 2000
          })
        }
      })
    } else {
      wx.request({
        url: config.base_url + '/api/booklist/add_book?id=' + this.other.bookid,
        header: {
          Authorization: 'Bearer ' + app.globalData.token
        },
        success: res => {
          if (res.data.ok) {
            // wx.showToast({ title: '加入书架成功', icon: 'success' })
            this.setData({
              isInList: true
            })
          } else if (res.data.authfail) {
            wx.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          } else {
            wx.showToast({
              title: res.data.msg || '加入书架失败，请重新尝试~',
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: function (err) {
          wx.showToast({
            title: '加入书架失败，请重新尝试~',
            icon: 'none',
            duration: 2000
          })
        }
      })
    }
  },
  addLikeNum: function (event) {
    let commentid = event.currentTarget.dataset.commentid
    let index = event.currentTarget.dataset.index
    wx.request({
      url: config.base_url + '/api/comment/like?commentid=' + commentid + '&op=' + (this.data.comments[index].is_like ? 'remove' : 'add'),
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      success: res => {
        if (res.data.ok) {
          let key1 = 'comments[' + index + '].like_num'
          let key2 = 'comments[' + index + '].is_like'
          this.setData({
            [key1]: res.data.current,
            [key2]: this.data.comments[index].is_like ? false : true
          })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          wx.showToast({
            title: res.data.msg || '点赞失败~',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        wx.showToast({
          title: '点赞失败~',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  readMoreComments: function (event) {
    let commentid = event.currentTarget.dataset.commentid
    let index = event.currentTarget.dataset.index
    let key = 'comments[' + index + '].isOpenMoreComment'
    this.setData({
      [key]: !this.data.comments[index].isOpenMoreComment
    })
  },
  toWriteComment: function (event) {
    console.log(event)
    if (event.currentTarget.id == 'write') {
      this.setData({
        commentInputHide: false,
        commentType: null
      })
    } else {
      const commentid = event.currentTarget.dataset.commentid
      const username = event.currentTarget.dataset.username
      const storeUsername = app.globalData.userInfo.username
      if (storeUsername === username) {
        wx.showToast({
          title: '自己不能回复自己',
          icon: 'none',
          duration: 2000
        })
      } else {
        this.setData({
          commentInputHide: false,
          commentType: {
            id: commentid,
            username: username
          }
        })
      }
    }
    app.reportFormId('comment', event.detail.formId, this.other.bookid)
  },
  hideCommentBar: function () {
    this.setData({
      commentInputHide: true
    })
  },
  stageCommentValue: function (e) {
    this.setData({
      currentCommentValue: e.detail.value
    })
  },
  saveFormId: function (event) { },
  sendComment: function (event) {
    let content = event.detail.value
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/comment/add',
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      data: {
        bookid: this.other.bookid,
        content: content,
        father: this.data.commentType ? this.data.commentType.id : ''
      },
      success: res => {
        if (res.data.ok) {
          wx.showToast({
            title: '发布书评成功',
            icon: 'success'
          })
          let comments = this.data.comments
          comments.unshift(res.data.data)
          // 清空当前评论内容，重新加载comment
          this.setData({
            currentCommentValue: ''
          })
          this.getCommentList(this.other.bookid)
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          wx.showToast({
            title: res.data.msg || '发布书评失败~',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        wx.showToast({
          title: '发布书评失败~',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  goToReader: function (event) {
    const formId = event.detail.formId
    app.reportFormId('read', formId, this.other.bookid)
    wx.navigateTo({
      url: '../reader-new/reader-new?bookid=' + this.other.bookid
    })
  },
  gotoIndex: function () {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
  // 订阅或者取消本书
  rssThisBook: function (event) {
    let rss = parseInt(event.target.dataset.rrs)
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/booklist/rss',
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      data: {
        bookid: this.other.bookid,
        rss: rss ? 1 : 0
      },
      success: res => {
        if (res.data.ok) {
          this.setData({
            hasRssTheBook: !!rss
          })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          wx.showToast({
            title: res.data.msg || '订阅书籍失败，请重试',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: function (err) {
        wx.showToast({
          title: '订阅书籍失败，请重试',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  openShareModal: function () {
    this.setData({
      modal: {
        show: true,
        name: 'share',
        title: '选择分享类型',
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
  // 获取自动解锁分享秘钥
  autoUnLockShare: function () {
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/secret/pre_create',
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      data: {
        bookid: this.other.bookid
      },
      success: res => {
        if (res.data.ok) {
          this.setData({
            modal: {
              show: true,
              name: 'auto_unlock',
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
          this.other.auto_secret_code = res.data.data
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          wx.showToast({
            title: res.data.msg || '好像不对哦~',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: function (err) {
        wx.showToast({
          title: '好像不对哦~',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  autoUnLockBook: function () {
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/secret/pre_secret_open',
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      data: {
        pre_secret: this.other.auto_unlock_code
      },
      success: res => {
        if (res.data.ok) {
          wx.showToast({
            title: '开始阅读吧~',
            icon: 'success'
          })
          this.setData({
            hasUnLock: true
          })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else if (res.data.repeat) {
          return
        } else {
          wx.showToast({
            title: res.data.msg || '好像不对哦~',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: function (err) {
        wx.showToast({
          title: '好像不对哦~',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  closeModal: function () {
    this.setData({
      'modal.show': false
    })
  },
  // 订阅提示不再显示
  rssNoShow: function () {
    let noRssShowArr = wx.getStorageSync('noRssShowArr') || [];
    this.setData({
      'isShowRss': false
    });
    if (noRssShowArr.indexOf(this.other.bookid) < 0) {
      noRssShowArr.push(this.data.other)
      wx.setStorageSync('noRssShowArr', noRssShowArr)
    }
  }
})