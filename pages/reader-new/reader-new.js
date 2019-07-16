// pages/user/user.js
const config = require('../../config')
const utils = require('../../utils/util')
const app = getApp()

Page({
  data: {
    loading: true,
    chapterInfo: '',
    content: '',
    showMenu: false,
    menuName: 'default',
    chapterNum: 1,
    maxChapterNum: 1,
    fontSize: 18,
    bright: 50,
    isAutoBuy: true,
    useNightStyle: false,
    showReaderTips: false,
    canRead: true,
    loadFail: false, // 章节加载失败
    shutChargeTips: false, // 是否关闭充值引导
  },
  other: {
    bookid: '',
    name: '',
    updateStatus: '',
    hasRssTheBook: 0,
    preload: {
      loaded: false,
      data: ''
    },
    scrollTopTimer: null,
    scrollTopValue: 0,
    readTime: 0,
    preChapterNum: 1,
    backFromMulu: false,
    backFromMuluId: '',
  },
  onLoad: function (options) {
    if (!options.bookid) {
      wx.showToast({ title: '页面参数错误', icon: 'none', duration: 2000 })
      wx.navigateBack({ delta: 1 })
      return false
    }
    this.other.bookid = options.bookid
    // 获取章节
    this.getChapter('', options.chapterid, true, false)
    // 获取缓存的阅读设置
    let readerSetting = wx.getStorageSync('readerSetting')
    // 获取并设置亮度
    wx.getScreenBrightness({
      success: res => {
        this.setData({ bright: parseInt(res.value * 100) })
      }
    })
    // if (readerSetting.bright) {
    //   wx.setScreenBrightness({ value: parseInt(readerSetting.bright) / 100 })
    // } else {
    //   wx.getScreenBrightness({
    //     success: res => {
    //       this.setData({ bright: parseInt(res.value * 100) })
    //     }
    //   })
    // }
    // 其他设置
    if (readerSetting) {
      this.setData(readerSetting)
    }
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: readerSetting.useNightStyle ? '#343434' : '#1472e0'
    })
    // 是否展示阅读提示
    let readerTips = wx.getStorageSync('readerTips')
    if (!readerTips) {
      this.setData({ showReaderTips: !readerTips, showMenu: true, menuName: 'default', shutChargeTips: app.globalData.globalSetting.shut_charge_tips })
    } else {
      this.setData({ showReaderTips: !readerTips, shutChargeTips: app.globalData.globalSetting.shut_charge_tips })
    }
  },
  onUnload: function () {
    // 存储阅读器设置
    wx.setStorageSync('readerSetting', {
      fontSize: this.data.fontSize,
      bright: this.data.bright,
      isAutoBuy: this.data.isAutoBuy,
      useNightStyle: this.data.useNightStyle,
      isAutoBuy: this.data.isAutoBuy
    })
    this.updateRead()
    clearInterval(this.other.scrollTopTimer)
  },
  //跳出页面执行函数
  onHide: function () {
    // 存储阅读器设置
    wx.setStorageSync('readerSetting', {
      fontSize: this.data.fontSize,
      bright: this.data.bright,
      isAutoBuy: this.data.isAutoBuy,
      useNightStyle: this.data.useNightStyle,
      isAutoBuy: this.data.isAutoBuy
    })
    this.updateRead()
    clearInterval(this.other.scrollTopTimer)
  },
  onShow: function () {
    // 判断是否从目录返回，如果是则加载指定章节
    if (this.other.backFromMulu && this.other.backFromMuluId) {
      this.getChapter('', this.other.backFromMuluId, true, true)
      this.other.backFromMulu = false
      this.other.backFromMuluId = ''
    }
    // 每过2s记录下阅读状态
    this.other.scrollTopTimer = setInterval(() => {
      let query = wx.createSelectorQuery()
      query.selectViewport().scrollOffset()
      query.exec(res => {
        if (res[0].scrollTop !== this.other.scrollTopValue) {
          this.other.readTime += 1000
        }
        this.other.scrollTopValue = res[0].scrollTop
      })
    }, 1000)
  },
  // 即将滑动到底部的回调函数，用来预加载下一章
  onReachBottom: function () {
    if (!this.other.preload.loaded) {
      this.preLoadChapter(this.data.chapterNum + 1)
    }
  },
  // 获取章节数据
  /**
   * skipPreload 忽略已经预加载的数据
   * scrollTopAuto 是否自动滚动到顶部
   */
  getChapter: function (num, chapterid, skipPreload, scrollTopAuto) {
    this.other.preChapterNum = this.data.chapterNum
    if (!skipPreload && num && this.other.preload.loaded) {
      let res = this.other.preload.data
      if (res.ok) {
        this.setData({
          chapterInfo: `第${res.data.num}章 ${res.data.name}`,
          content: ' ' + res.data.content.replace(/[\r\n]+\s*/g, '\n\n '),
          chapterNum: res.data.num,
          maxChapterNum: res.newest,
          canRead: res.canRead
        })
        this.other = Object.assign(this.other, {
          name: res.bookname,
          updateStatus: res.update_status,
          hasRssTheBook: res.rss,
          preload: {
            loaded: false,
            data: ''
          }
        })
        // 设置标题
        wx.setNavigationBarTitle({ title: res.data.name })
        // 滑动到指定位置
        setTimeout(() => {
          if (scrollTopAuto) {
            wx.pageScrollTo({ scrollTop: 0, duration: 0 })
          } else {
            wx.pageScrollTo({ scrollTop: parseInt(res.scroll), duration: 0 })
          }
        }, 100)
      } else {
        this.showLoadFailPage()
      }
      return false
    }
    this.setData({ loading: true })
    let queryStr = num ? '&chapter_num=' + num : ''
    queryStr += chapterid ? '&chapter_id=' + chapterid : ''
    wx.request({
      url: config.base_url + '/api/chapter/detail?bookid=' + this.other.bookid + queryStr,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          this.setData({
            chapterInfo: `第${res.data.data.num}章 ${res.data.data.name}`,
            content: ' ' + res.data.data.content.replace(/[\r\n]+\s*/g, '\n\n '),
            loading: false,
            chapterNum: res.data.data.num,
            maxChapterNum: res.data.newest,
            canRead: res.data.canRead
          })
          this.other = Object.assign(this.other, {
            name: res.data.bookname,
            updateStatus: res.data.update_status,
            hasRssTheBook: res.data.rss,
            preload: {
              loaded: false,
              data: ''
            },
            scrollTopValue: parseInt(res.data.scroll)
          })
          // 设置标题
          wx.setNavigationBarTitle({ title: res.data.data.name })
          // 滑动到指定位置
          setTimeout(() => {
            if (scrollTopAuto) {
              wx.pageScrollTo({ scrollTop: 0, duration: 0 })
            } else {
              wx.pageScrollTo({ scrollTop: parseInt(res.data.scroll), duration: 0 })
            }
          }, 100)
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (utils.getCurrentPageUrlWithArgs().indexOf('/loading/loading?need_login_again=1') < 0) {
            wx.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          } else {
            this.showLoadFailPage()
          }
        } else {
          // 展示获取章节失败的界面
          this.showLoadFailPage()
        }
      },
      fail: err => {
        this.showLoadFailPage()
      }
    })
  },
  // 章节预加载函数
  preLoadChapter: function (num) {
    wx.request({
      url: config.base_url + '/api/chapter/detail?bookid=' + this.other.bookid + '&chapter_num=' + num,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          this.other.preload.data = res.data
          this.other.preload.loaded = true
        }
      }
    })
  },
  // 章节加载失败的回调函数
  showLoadFailPage: function () {
    this.setData({ loading: false, loadFail: true, chapterNum: this.other.preChapterNum + 1 })
  },
  // 跳转到目录页面
  gotoMulu: function () {
    wx.navigateTo({ url: '../reader-mulu/reader-mulu?bookid=' + this.other.bookid + '&name=' + this.other.name })
  },
  // 点击上一章或者下一章的执行函数
  loadChapter: function (event) {
    if (event.currentTarget.dataset.op === 'pre') {
      // 点击上一章
      if (this.data.chapterNum - 1 <= 0) {
        wx.showToast({ title: '当前已经是第一章了', icon: 'none', duration: 2000 })
        return false
      }
      this.other.preload = {
        loaded: false,
        data: ''
      }
      this.getChapter(this.data.chapterNum - 1, '', true, true)
    } else if (event.currentTarget.dataset.op === 'next') {
      // 点击下一章
      if (this.data.chapterNum + 1 > this.data.maxChapterNum) {
        // 判断是否是连载书籍，如果是则提示订阅书籍
        if (this.other.updateStatus === '连载中') {
          if (!this.other.hasRssTheBook) {
            wx.showModal({
              title: '温馨提示',
              content: '你已经阅读到了最后一章，如果喜欢这本书，可以点击下方按钮订阅本书。书籍章节更新时我们会在第一时间通知你.~',
              confirmText: '订阅本书',
              confirmColor: '#1AAD19',
              success: res => {
                if (res.confirm) {
                  wx.request({
                    method: 'POST',
                    url: config.base_url + '/api/booklist/rss',
                    header: { Authorization: 'Bearer ' + app.globalData.token },
                    data: {
                      bookid: this.other.bookid,
                      rss: 1
                    },
                    success: res => {
                      if (res.data.ok) {
                        wx.showToast({
                          icon: 'success',
                          title: '订阅成功'
                        })
                        this.other.hasRssTheBook = 1
                        let hasRssBookArr = wx.getStorageSync('hasRssBookArr') || []
                        if (hasRssBookArr.indexOf(this.other.bookid) < 0) {
                          hasRssBookArr.push(this.other.bookid)
                          wx.setStorageSync('hasRssBookArr', hasRssBookArr)
                        }
                      } else if (res.data.authfail) {
                        wx.navigateTo({
                          url: '../loading/loading?need_login_again=1'
                        })
                      } else {
                        wx.showToast({ title: res.data.msg || '订阅书籍失败，请重试' })
                      }
                    },
                    fail: err => {
                      wx.showToast({ title: '订阅书籍失败，请重试' })
                    }
                  })
                }
              }
            })
          } else {
            wx.showToast({ title: '当前已经是最后一章了', icon: 'none', duration: 2000 })
          }
        } else {
          wx.showModal({
            title: '温馨提示',
            content: '您已经读完全书，去首页发现更多好书吧~',
            confirmText: '前往首页',
            confirmColor: '#1AAD19',
            success(res) {
              if (res.confirm) {
                wx.switchTab({
                  url: '/pages/index/index'
                })
              }
            }
          })
        }
        return false
      }
      this.getChapter(this.data.chapterNum + 1)
    } else {
      wx.showToast({ title: '错误操作', icon: 'none', duration: 2000 })
    }
    // 如果菜单为显示状态则关闭菜单
    if (this.data.showMenu) {
      this.setData({ showMenu: false, menuName: 'default' })
    }
    // 页面滚动到顶部
    wx.pageScrollTo({ scrollTop: 0, duration: 0 })
  },
  // 章节滑块的change事件
  changeChapterSlide: function (event) {
    this.getChapter(event.detail.value, '', true, true)
  },
  // 字体改变的change事件
  changeFontSize: function (event) {
    if (event.currentTarget.dataset.op === 'reduce') {
      this.setData({ fontSize: this.data.fontSize - 1 })
    } else if (event.currentTarget.dataset.op === 'add') {
      this.setData({ fontSize: this.data.fontSize + 1 })
    }
  },
  // 字体滑块的change事件
  changeBright: function (event) {
    let bright = event.detail.value / 100
    wx.setScreenBrightness({ value: bright })
    this.setData({ bright: event.detail.value })
  },
  // 是否选择自动购买下一章
  changeAutoBuy: function (event) {
    this.setData({ isAutoBuy: event.detail.value })
    wx.request({
      url: config.base_url + '/api/user/put_user_setting',
      method: 'PUT',
      data: {
        setting: { autoBuy: event.detail.value }
      },
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          return true
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          wx.showToast({ title: '更新设置失败', icon: 'none', duration: 2000 })
        }
      },
      fail: err => {
        wx.showToast({ title: '更新设置失败', icon: 'none', duration: 2000 })
      }
    })
  },
  // 点击阅读器触发的菜单的显示和隐藏函数
  triggleMenu: function () {
    if (this.data.showMenu) {
      this.setData({ showMenu: false, menuName: 'default' })
    } else {
      this.setData({ showMenu: true, menuName: 'default' })
    }
  },
  // 切换目录面板
  switchMenu: function (event) {
    let name = event.currentTarget.dataset.name
    if (name === 'night') {
      // 修改状态栏颜色
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: this.data.useNightStyle ? '#1472e0' : '#343434'
      })
      this.setData({ useNightStyle: !this.data.useNightStyle })
    } else if (name === 'menu') {
      this.gotoMulu()
    } else {
      this.setData({ menuName: name })
    }
  },
  closeReaderTips: function () {
    this.setData({ showReaderTips: false, showMenu: false, menuName: 'default' })
    wx.setStorageSync('readerTips', true)
  },
  gotoFriendHelp: function () {
    wx.navigateTo({ url: '../activities/friendHelp/friendHelp' })
  },
  // 购买该章节
  buyChapter: function () {
    wx.request({
      url: config.base_url + '/api/chapter/buy?bookid=' + this.other.bookid + '&chapter_num=' + this.data.chapterNum,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          // 隐藏购买提示
          this.setData({ canRead: true })
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (utils.getCurrentPageUrlWithArgs().indexOf('/loading/loading?need_login_again=1') < 0) {
            wx.navigateTo({ url: '../loading/loading?need_login_again=1' })
          }
        } else if (res.data.nomoney) {
          // 费用不足
          wx.showModal({
            title: '温馨提示',
            content: '书币不足，您可以通过分享、签到等方式获得书币。',
            confirmText: '前往签到',
            success(res) {
              if (res.confirm) {
                wx.navigateTo({ url: '../attendance/attendance' })
              }
            }
          })
        } else {
          wx.showToast({ title: '购买失败' + (res.data.msg ? '，' + res.data.msg : ''), icon: 'none', duration: 2000 })
        }
      },
      fail: err => {
        wx.showToast({ title: '购买失败', icon: 'none', duration: 2000 })
      }
    })
  },
  buyTotal: function () {
    wx.showModal({
      title: '温馨提示',
      content: '请前往书籍详情页成为粉丝',
      confirmText: '立即前往',
      success: res => {
        if (res.confirm) {
          wx.navigateTo({ url: '../bookdetail/bookdetail?id=' + this.other.bookid })
        }
      }
    })
  },
  // 取消购买，返回上一次阅读章节
  buyCancel: function () {
    this.getChapter(this.other.preChapterNum - 1 > 0 ? this.other.preChapterNum - 1 : 1, '', true, true)
  },
  gotoDetail: function () {
    let pages = getCurrentPages()
    let lastPage = pages.length > 2 ? pages[pages.length - 2].route : ''
    // 判断上一页是否是书籍详情页面，如果是则返回，否则则打开书籍详情页
    if (lastPage.indexOf('pages/bookdetail/bookdetail') > -1) {
      wx.navigateBack({ delta: 1 })
    } else {
      wx.navigateTo({ url: '../bookdetail/bookdetail?id=' + this.other.bookid })
    }
  },
  updateRead: function () {
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/booklist/update_read',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        bookid: this.other.bookid,
        chapter_num: this.data.chapterNum,
        chapter_page_index: 0,
        chapter_page_top: this.other.scrollTopValue,
        read_time: this.other.readTime
      },
      success: res => {
        if (res.data.ok) {
          return true
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (utils.getCurrentPageUrlWithArgs().indexOf('/loading/loading?need_login_again=1') < 0) {
            wx.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          }
        } else {
          wx.showToast({ title: '更新阅读进度失败', icon: 'none', duration: 2000 })
        }
      },
      fail: err => {
        wx.showToast({ title: '更新阅读进度失败', icon: 'none', duration: 2000 })
      }
    })
  },
  reloadCurChapter: function () {
    this.getChapter(this.data.chapterNum, '', true, true)
  }
})
