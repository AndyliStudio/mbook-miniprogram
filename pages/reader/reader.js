//reader.js
const config = require('../../config')
const utils = require('../../utils/util')
const Interval = require('../../utils/interval')
const app = getApp()

let currentGesture = 0 //控制当一个手势进行的时候屏蔽其他的手势
let isMoving = 0
let hasRunTouchMove = false
let readTimer = null
let scrollTopValue = 0
let scrollTopTimer = null
let sectionDataBeforeSearch = null // 搜索之前的章节数据
let scrollTopBeforeSearch = 0
let hasRunSearchInputConfrim = false // 是否执行过搜索了
let allSectionRawData = [] // 章节原始数据

//从原始章节中解析出正确的章节数据
function compileRowSectionData() {
  let sections = []
  // 排序allSectionRawData
  allSectionRawData.sort((item1, item2) => {
    return item1.index - item2.index
  })
  for (let i = 0; i < allSectionRawData.length; i++) {
    if (!allSectionRawData[i].finished) {
      break
    }
    sections = sections.concat(allSectionRawData[i].data)
  }
  return sections
}

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
    bookid: '',
    factionName: '',
    author: '',
    updateStatus: '',
    headImg: '', // 小说图像
    factionTitle: '',
    content: '',
    currentSectionNum: 1,
    backupSectionNum: 1,
    newestSectionNum: 1,
    allSliderValue: {
      section: 1,
      bright: 1,
      font: 36 //单位rpx
    },
    isShowFontSelector: 0, //是否显示选择字体详情板块
    allFontFamily: ['使用系统字体', '微软雅黑', '黑体', 'Arial', '楷体', '等线'],
    currentFontFamily: '使用系统字体',
    lineHeight: 32, //单位rpx
    control: {
      all: 0,
      control_tab: 0,
      control_detail: 0,
      target: ''
    }, //all表示整个控制是否显示，第一点击显示，再一次点击不显示;target表示显示哪一个detail
    colorStyle: {
      content_bg: '#f8f7fc',
      styleNum: 1,
      slider_active_bg: '#757e87',
      slider_noactive_bg: '#dfdfdf',
      control_bg: '#ffffff',
      control_fontColor: '#616469',
      button_bg: '#bec2c5',
      button_font_color: '#0770cb',
      border_color: '#bababa'
    }, //1、2、3、4分别对应四种颜色模式
    isShowMulu: 0, // 是否显示左侧栏
    currentMuluPage: 1,
    allSectionData: [], // 所有章节数据
    allSectionDataTotal: 0, // 总章节数
    hasLoadMulu: false, // 是否加载过章节了
    hasNoMoreChapter: false, // 已经加载全部目录
    showReaderTips: true, // 是否展示阅读提示
    tipsText: '点击屏幕正中间\n展示控制栏',
    windows: {
      windows_height: 0,
      windows_width: 0
    },
    leftValue: 0, // 左滑动的值
    pageIndex: 1, // 当前页数值
    touches: {}, // 记录触点位置信息
    hasGotMaxNum: false, // 是否已经计算得到最大分页数
    maxPageNum: 11, // 本章的最大页数
    moveDirection: '', // 翻页方向，0表示向后翻页，1表示向前翻页
    isShowBuy: true, // 是否显示购买章节界面
    secretTips: '',
    beforeLoaded: false, // 预加载相关变量
    beforeData: '',
    afterLoaded: false,
    afterData: '',
    loading: false, // 加载状态
    loadFail: false, // 显示加载失败页面
    useTransition: true, // 是否使用滑动的transition动画，在切换下一章的时候应该关闭
    overPage: 1, // 阅读器翻页模式
    shutChargeTips: false,
    hasReadTime: 0, // 已阅读时长
    hasRssTheBook: false, // 是否已经订阅了本书
    showSearchInputClose: false, // 是否展示搜索框的关闭按钮
    showLookMoreChapter: true, // 是否展示查看更多章节
    searchInputValue: '', // 搜索输入框的值
    searchTopValue: 0 // 搜索章节的滚动高度
  },
  onLoad: function(options) {
    //动态设置标题
    const bookid = options.bookid || '5a0d7a6ec38abf73e8e65cb3'
    const secretTips = app.globalData.globalSetting ? app.globalData.globalSetting.secret_tips : '请联系客服，在支付2-3元后，客服人员会发送给你一个串阅读秘钥用来解锁整本书。'
    this.setData({ bookid: bookid, secretTips: secretTips })
    // 判断是否需要显示提示
    const showReaderTips = app.globalData.showReaderTips
    if (showReaderTips || showReaderTips === '') {
      this.setData({ 
        bookid: bookid,
        secretTips: secretTips,
        showReaderTips: true,
        shutChargeTips: app.globalData.globalSetting.shut_charge_tips || false
      })
    } else {
      this.setData({ 
        bookid: bookid,
        secretTips: secretTips,
        showReaderTips: false,
        shutChargeTips: app.globalData.globalSetting.shut_charge_tips || false
      })
    }
    //读取用户设置
    let localSetting = app.globalData.userInfo || {}
    if (localSetting && localSetting.setting) {
      let userSetting = localSetting.setting
      this.setData({
        'allSliderValue.bright': userSetting.reader.bright || this.data.allSliderValue.bright,
        'allSliderValue.font': userSetting.reader.fontSize || this.data.allSliderValue.font,
        colorStyle: this.transColorStyle(userSetting.reader.mode) || this.data.colorStyle,
        currentFontFamily: userSetting.reader.fontFamily || this.data.currentFontFamily,
        overPage: userSetting.reader.overPage
      })
    }
    // 设置背景色
    wx.setNavigationBarColor({
      frontColor: this.data.colorStyle.styleNum == 4 ? '#ffffff' : '#000000',
      backgroundColor: this.data.colorStyle.control_bg,
      animation: {
        duration: 0,
        timingFunc: 'easeIn'
      },
      fail: () => {
        
        this.showToast('设置背景色失败', 'bottom')
      }
    })
    // 初始化页面
    this.initPage()
    if (this.data.overPage === 1) {
      scrollTopTimer = setInterval(() => {
        let query = wx.createSelectorQuery()
        query.selectViewport().scrollOffset()
        query.exec(res => {
          scrollTopValue = res[0].scrollTop
        })
      }, 3000)
    }
  },
  //跳出页面执行函数
  onUnload: function() {
    //onUnload方法在页面被关闭时触发，我们需要将用户的当前设置存下来
    let localSetting = app.globalData.userInfo || {}
    if (localSetting && localSetting.setting) {
      localSetting.setting.reader = {
        bright: this.data.allSliderValue.bright,
        fontSize: this.data.allSliderValue.font,
        fontFamily: this.data.currentFontFamily,
        mode: this.transMode(this.data.colorStyle.styleNum),
        overPage: this.data.overPage
      }
    }
    wx.setStorageSync('userinfo', localSetting)
    this.updateRead(localSetting.setting)
    clearInterval(scrollTopTimer)
  },
  //跳出页面执行函数
  onHide: function() {
    let localSetting = app.globalData.userInfo || {}
    if (localSetting && localSetting.setting) {
      localSetting.setting.reader = {
        bright: this.data.allSliderValue.bright,
        fontSize: this.data.allSliderValue.font,
        fontFamily: this.data.currentFontFamily,
        mode: this.transMode(this.data.colorStyle.styleNum),
        overPage: this.data.overPage
      }
    }
    wx.setStorageSync('userinfo', localSetting)
    this.updateRead(localSetting.setting)
    clearInterval(scrollTopTimer)
  },
  // 分享逻辑
  onShareAppMessage: function(res) {
    // 获取分享出去的图片地址
    const shareParams = app.globalData.globalSetting.share
    const code = app.globalData.shareCode + '|' + Date.now()
    if (shareParams && app.globalData.shareCode) {
      return {
        title: shareParams.title,
        path: shareParams.page + '?code=' + code
      }
    } else {
      this.showToast('获取分享参数失败', 'bottom')
      return false
    }
  },
  handletouchmove: function(event) {
    var self = this
    if (currentGesture != 0 || isMoving == 1) {
      return
    }
    var currentX = event.touches[0].pageX
    var currentY = event.touches[0].pageY
    // 判断用没有滑动而是点击屏幕的动作
    hasRunTouchMove = true
    var direction = 0
    if (currentX - self.data.touches.lastX < 0) {
      direction = 0
    } else if (currentX - self.data.touches.lastX > 0) {
      direction = 1
    }
    //需要减少或者增加的值
    var moreOrLessValue = Math.abs(currentX - self.data.touches.lastX)
    //将当前坐标进行保存以进行下一次计算
    self.setData({ touches: { lastX: currentX, lastY: currentY }, moveDirection: direction })
    var currentIndex = self.data.pageIndex
    if (direction == 0) {
      if (currentIndex < self.data.maxPageNum) {
        self.setData({ useTransition: true, leftValue: self.data.leftValue - moreOrLessValue })
      }
    } else {
      if (currentIndex > 1) {
        self.setData({ useTransition: true, leftValue: self.data.leftValue + moreOrLessValue })
      }
    }
  },
  handletouchtart: function(event) {
    // 判断用户的点击事件，如果不是滑动，将不会执行touchmove
    hasRunTouchMove = false
    if (isMoving == 0) {
      this.setData({ touches: { lastX: event.touches[0].pageX, lastY: event.touches[0].pageY } })
    }
  },
  handleDownClick: function(event) {
    if (event.target.dataset.control === 'no') {
      return false
    }
    this.setData({
      control: {
        all: this.data.control.all === 0 ? 1 : 0,
        control_tab: 1,
        control_detail: 1,
        target: this.data.control.target || 'color'
      },
      isShowFontSelector: 0
    })
  },
  handletouchend: function() {
    var self = this
    // 判断用户的点击事件，决定是否显示控制栏
    if (hasRunTouchMove == false) {
      var y = self.data.touches.lastY
      var x = self.data.touches.lastX
      var h = self.data.windows.windows_height / 2
      var w = self.data.windows.windows_width / 2
      if (x && y && y >= h - 100 && y <= h + 100 && x >= w - 100 && x <= w + 100) {
        self.setData({
          control: {
            all: self.data.control.all === 0 ? 1 : 0,
            control_tab: 1,
            control_detail: 1,
            target: self.data.control.target || 'color'
          },
          isShowFontSelector: 0
        })
        return
      } else if (x && x < w - 100) {
        self.setData({ moveDirection: 1 })
      } else if (x && x > w + 100) {
        self.setData({ moveDirection: 0 })
      }
      // 如果是下翻页式，下面的代码将不用执行
      if (self.data.overPage === 1) {
        return false
      }
    }
    currentGesture = 0
    //左滑动和右滑动的操作
    var currentIndex = self.data.pageIndex //当前页数
    var targetLeftValue = null //移动之后content的目标左值
    var pingjunValue = null //500ms内平均每100ms移动的值
    if (isMoving == 0) {
      if (self.data.moveDirection === 0) {
        if (currentIndex < self.data.maxPageNum) {
          targetLeftValue = -1 * (self.data.windows.windows_width - 10) * currentIndex
          self.setData({ useTransition: true, leftValue: targetLeftValue })
          // 还剩下3页的时候去预加载
          if (self.data.maxPageNum - currentIndex <= 3 && !self.data.afterLoaded) {
            self.loadAfter()
          }
          self.setData({ pageIndex: ++currentIndex })
        } else {
          self.loadNextChapter()
        }
      } else if (self.data.moveDirection === 1) {
        //前一页和后一页相差其实是2个-320px
        if (currentIndex > 1) {
          targetLeftValue = -1 * (self.data.windows.windows_width - 10) * (currentIndex - 2)
          self.setData({ useTransition: true, leftValue: targetLeftValue })
          // 还剩下3页的时候去预加载
          if (currentIndex <= 3 && !!self.data.beforeLoaded) {
            self.loadBefore()
          }
          self.setData({ pageIndex: --currentIndex })
        } else {
          self.loadPreChapter()
        }
      }
    } else {
    }
  },
  sectionSliderChange: function(event) {
    var self = this
    self.setData({
      'allSliderValue.section': event.detail.value,
      backupSectionNum: self.data.currentSectionNum,
      beforeLoaded: false,
      beforeData: '',
      afterLoaded: false,
      afterData: '',
      loading: true
    })
    //根据章节id去得到章节内容
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/chapter/detail?bookid=' + self.data.bookid + '&chapter_num=' + event.detail.value,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success(res) {
        if (res.data.ok) {
          self.setData({
            currentSectionNum: res.data.data.num,
            content: ' ' + res.data.data.content.replace(/[\r\n]+\s*/g, '\n '),
            factionTitle: res.data.data.name,
            'allSliderValue.section': res.data.data.num,
            hasGotMaxNum: false,
            pageIndex: 1,
            useTransition: false,
            leftValue: 0,
            isShowBuy: !res.data.canRead
          })
          if (res.data.canRead && res.data.doAutoBuy) {
            self.showToast('已为您自动给购买该章节', 'bottom')
          }
          wx.setNavigationBarTitle({
            title: '第' + res.data.data.num + '章 ' + res.data.data.name
          })
          // 如果为上下翻页，则不需要重新计算最大分页数
          if (self.data.overPage === 1) {
            wx.pageScrollTo({ scrollTop: 0, duration: 0 })
            self.setData({ loading: false })
          } else {
            // 重新计算最大分页数
            wx.createSelectorQuery()
              .select('#content-out')
              .boundingClientRect(function(rect) {
                self.setData({
                  maxPageNum: Math.ceil(rect.height / parseInt(self.data.windows.windows_height - 20)),
                  hasGotMaxNum: true,
                  loading: false
                })
              })
              .exec()
          }
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (utils.getCurrentPageUrlWithArgs().indexOf('/loading/loading?need_login_again=1') < 0) {
            wx.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          }
          self.setData({ loading: false, loadFail: true })
        } else {
          self.setData({ loading: false, loadFail: true })
          
          self.showToast('获取章节内容失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail(err) {
        self.setData({ loading: false, loadFail: true })
        
        self.showToast('获取章节内容失败', 'bottom')
      }
    })
  },
  brightSliderChange: function(event) {
    var self = this
    var bright = event.detail.value / 100
    wx.setScreenBrightness({
      value: bright
    })
    self.setData({
      'allSliderValue.bright': bright
    })
  },
  fontSliderChange: function(event) {
    var self = this
    //重新计算分页
    self.setData({
      'allSliderValue.font': event.detail.value
    })
  },
  gotoControlDetail: function(event) {
    var self = this
    var target = event.currentTarget.dataset.control
    // 这里control_detail需要做两层判断，首先是control_detail之前是0还是1，0变成1,1变成0，其次是target在两次点击中是否相同，相同则继续上面的判断，否则取反
    var control_detail = null
    if (self.data.control.control_detail == '0') {
      // 当control_detail不显示的时候不再判断两次点击的目标是否相同，直接统一显示
      control_detail = 1
    } else {
      if (target && self.data.control.target == target) {
        control_detail = 0
      } else {
        control_detail = 1
      }
    }
    self.setData({
      control: {
        all: self.data.control.all,
        control_tab: 1,
        control_detail: control_detail,
        target: target
      }
    })
  },
  transMode() {
    if (this.data.colorStyle.styleNum === 1) {
      return '默认'
    } else if (this.data.colorStyle.styleNum === 2) {
      return '淡黄'
    } else if (this.data.colorStyle.styleNum === 3) {
      return '护眼'
    } else if (this.data.colorStyle.styleNum === 4) {
      return '夜间'
    } else {
      return '默认'
    }
  },
  transColorStyle: function(cname) {
    if (cname === '默认') {
      return {
        content_bg: '#f8f7fc',
        styleNum: 1,
        slider_active_bg: '#757e87',
        slider_noactive_bg: '#dfdfdf',
        control_bg: '#ffffff',
        control_fontColor: '#616469',
        button_bg: '#bec2c5',
        button_font_color: '#0770cb',
        border_color: '#bababa'
      }
    } else if (cname === '淡黄') {
      return {
        content_bg: '#f6f0da',
        styleNum: 2,
        slider_active_bg: '#766f69',
        slider_noactive_bg: '#dad4c4',
        control_bg: '#faf4e4',
        control_fontColor: '#60594f',
        button_bg: '#c1bbab',
        button_font_color: '#866842',
        border_color: '#90ad91'
      }
    } else if (cname === '护眼') {
      return {
        content_bg: '#c0edc6',
        styleNum: 3,
        slider_active_bg: '#657568',
        slider_noactive_bg: '#aeccd6',
        control_bg: '#ccf1d0',
        control_fontColor: '#44644c',
        button_bg: '#a0baa1',
        button_font_color: '#3a732c',
        border_color: '#90ad91'
      }
    } else if (cname === '夜间') {
      return {
        content_bg: '#1d1c21',
        styleNum: 4,
        slider_active_bg: '#53565d',
        slider_noactive_bg: '#23282c',
        control_bg: '#10131a',
        control_fontColor: '#5b5e65',
        button_bg: '#212528',
        button_font_color: '#2c5a7e',
        border_color: '#2d3134'
      }
    } else {
      return {
        content_bg: '#f8f7fc',
        styleNum: 1,
        slider_active_bg: '#757e87',
        slider_noactive_bg: '#dfdfdf',
        control_bg: '#ffffff',
        control_fontColor: '#616469',
        button_bg: '#bec2c5',
        button_font_color: '#0770cb',
        border_color: '#bababa'
      }
    }
  },
  //点击切换颜色
  switchColorStyle: function(event) {
    var self = this
    var styleNum = event.currentTarget.dataset.stylenum
    switch (styleNum) {
      case '1':
        self.setData({
          colorStyle: {
            content_bg: '#f8f7fc',
            styleNum: 1,
            slider_active_bg: '#757e87',
            slider_noactive_bg: '#dfdfdf',
            control_bg: '#ffffff',
            control_fontColor: '#616469',
            button_bg: '#bec2c5',
            button_font_color: '#0770cb',
            border_color: '#bababa'
          }
        })
        break
      case '2':
        self.setData({
          colorStyle: {
            content_bg: '#f6f0da',
            styleNum: 2,
            slider_active_bg: '#766f69',
            slider_noactive_bg: '#dad4c4',
            control_bg: '#faf4e4',
            control_fontColor: '#60594f',
            button_bg: '#c1bbab',
            button_font_color: '#866842',
            border_color: '#90ad91'
          }
        })
        break
      case '3':
        self.setData({
          colorStyle: {
            content_bg: '#c0edc6',
            styleNum: 3,
            slider_active_bg: '#657568',
            slider_noactive_bg: '#aeccd6',
            control_bg: '#ccf1d0',
            control_fontColor: '#44644c',
            button_bg: '#a0baa1',
            button_font_color: '#3a732c',
            border_color: '#90ad91'
          }
        })
        break
      case '4':
        self.setData({
          colorStyle: {
            content_bg: '#1d1c21',
            styleNum: 4,
            slider_active_bg: '#53565d',
            slider_noactive_bg: '#23282c',
            control_bg: '#10131a',
            control_fontColor: '#5b5e65',
            button_bg: '#212528',
            button_font_color: '#2c5a7e',
            border_color: '#2d3134'
          }
        })
        break
    }
    // 设置背景色
    wx.setNavigationBarColor({
      frontColor: self.data.colorStyle.styleNum == 4 ? '#ffffff' : '#000000',
      backgroundColor: self.data.colorStyle.control_bg,
      animation: {
        duration: 0,
        timingFunc: 'easeIn'
      }
    })
  },
  selectFontFamily: function() {
    this.setData({
      isShowFontSelector: 1
    })
  },
  closeFontSelector: function() {
    this.setData({
      isShowFontSelector: 0
    })
  },
  changeFontFamily: function(event) {
    this.setData({
      currentFontFamily: event.currentTarget.dataset.fontname
    })
    //todo 执行改变字体后的重新排版
  },
  //打开目录侧边栏
  openMulu: function() {
    var self = this
    if (!self.data.hasLoadMulu) {
      allSectionRawData.push({
        index: 0,
        finished: false,
        data: []
      })
      wx.request({
        url: config.base_url + '/api/chapter/list?bookid=' + self.data.bookid + '&pageid=' + self.data.currentMuluPage,
        success: res => {
          if (res.data.ok) {
            allSectionRawData[0].finished = true
            allSectionRawData[0].data = res.data.list
            self.setData({
              allSectionData: compileRowSectionData(),
              allSectionDataTotal: res.data.total,
              hasLoadMulu: true,
              isShowMulu: 1,
              control: {
                all: 0,
                control_tab: 0,
                control_detail: 0,
                target: self.data.control.target || 'color'
              }
            })
            // 记录目录搜索之前的状态
            sectionDataBeforeSearch = self.data.allSectionData.slice()
            scrollTopBeforeSearch = 0
          } else {
            self.showToast('获取目录失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
          }
        },
        fail: err => {
          self.showToast('获取目录失败', 'bottom')
        }
      })
    } else {
      self.setData({
        isShowMulu: 1,
        control: {
          all: 0,
          control_tab: 0,
          control_detail: 0,
          target: self.data.control.target || 'color'
        }
      })
    }
  },
  loadMoreChapter: function() {
    let currentPage = this.data.currentMuluPage + 1;
    if (this.data.currentMuluPage * 50 < this.data.allSectionDataTotal) {
      allSectionRawData.push({
        index: currentPage - 1,
        finished: false,
        data: []
      })
      wx.showToast({ title: '加载中', icon: 'loading' })
      wx.request({
        url: config.base_url + '/api/chapter/list?bookid=' + this.data.bookid + '&pageid=' + currentPage,
        success: res => {
          wx.hideToast();
          if (res.data.ok) {
            allSectionRawData[currentPage - 1].finished = true
            allSectionRawData[currentPage - 1].data = res.data.list
            this.setData({
              allSectionData: compileRowSectionData(),
            })
            // 记录目录搜索之前的状态
            sectionDataBeforeSearch = this.data.allSectionData.slice()
          } else {
            this.showToast('获取目录失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
          }
        },
        fail: err => {
          wx.hideToast();
          this.showToast('获取目录失败', 'bottom')
        }
      })
      // 提前设置currentPage
      this.setData({
        currentMuluPage: currentPage,
      })
    } else {
      this.setData({ hasNoMoreChapter: true });
    }
  },
  //点击目录某一章
  showThisSection: function(event) {
    var self = this
    var chapterid = event.currentTarget.dataset.chapterid
    // 之前存储的章节预加载信息失效了
    self.setData({
      isShowMulu: 0,
      loading: true,
      beforeLoaded: false,
      beforeData: '',
      afterLoaded: false,
      afterData: ''
    })
    //根据章节id去得到章节内容
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/chapter/detail?bookid=' + self.data.bookid + '&chapter_id=' + chapterid,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success(res) {
        if (res.data.ok) {
          self.setData({
            currentSectionNum: res.data.data.num,
            content: ' ' + res.data.data.content.replace(/[\r\n]+\s*/g, '\n '),
            factionTitle: res.data.data.name,
            'allSliderValue.section': res.data.data.num,
            pageIndex: 1,
            useTransition: false,
            leftValue: 0,
            isShowBuy: !res.data.canRead,
            hasGotMaxNum: false
          })
          if (res.data.canRead && res.data.doAutoBuy) {
            self.showToast('已为您自动给购买该章节', 'bottom')
          }
          wx.setNavigationBarTitle({
            title: '第' + res.data.data.num + '章 ' + res.data.data.name
          })
          // 如果为上下翻页，则不需要重新计算最大分页数
          if (self.data.overPage === 1) {
            self.pageScrollTo({ scrollTop: 0, duration: 0 })
            self.setData({ loading: false })
          } else {
            // 重新计算最大分页数
            wx.createSelectorQuery()
              .select('#content-out')
              .boundingClientRect(function(rect) {
                self.setData({
                  maxPageNum: Math.ceil(rect.height / parseInt(self.data.windows.windows_height - 20)),
                  loading: false,
                  hasGotMaxNum: true
                })
              })
              .exec()
          }
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (utils.getCurrentPageUrlWithArgs().indexOf('/loading/loading?need_login_again=1') < 0) {
            wx.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          }
          self.setData({ loading: false, loadFail: true })
        } else {
          self.setData({ loading: false, loadFail: true })
          
          self.showToast('获取章节内容失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail(e) {
        self.setData({ loading: false, loadFail: true })
        
        self.showToast('获取章节内容失败', 'bottom')
      }
    })
  },
  initPage: function(chapterNum) {
    let self = this
    self.setData({ backupSectionNum: self.data.currentSectionNum - 1 > 0 ? self.data.currentSectionNum - 1 : 1, loading: true })
    let chapterStr = chapterNum ? '&chapter_num=' + chapterNum : ''
    wx.request({
      url: config.base_url + '/api/chapter/detail?bookid=' + self.data.bookid + chapterStr,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({
            newestSectionNum: res.data.newest,
            pageIndex: res.data.top,
            currentSectionNum: res.data.data.num,
            'allSliderValue.section': res.data.data.num,
            factionName: res.data.bookname,
            factionTitle: res.data.data.name,
            content: ' ' + res.data.data.content.replace(/[\r\n]+\s*/g, '\n '),
            author: res.data.author,
            updateStatus: res.data.update_status,
            hasRssTheBook: !!res.data.rss,
            headImg: res.data.headimg,
            isShowBuy: !res.data.canRead,
            hasGotMaxNum: false
          })
          if (res.data.canRead && res.data.doAutoBuy) {
            self.showToast('已为您自动给购买该章节', 'bottom')
          }
          // 设置标题
          wx.setNavigationBarTitle({
            title: '第' + res.data.data.num + '章 ' + res.data.data.name
          })
          // 如果为上下翻页，则不需要重新计算最大分页数
          if (app.globalData.userInfo.setting && app.globalData.userInfo.setting.reader.overPage === 1) {
            wx.getSystemInfo({
              success: function(response) {
                let top = res.data.scroll > 0 ? res.data.scroll : 0
                self.setData({
                  leftValue: top,
                  windows: {
                    windows_height: response.windowHeight,
                    windows_width: response.windowWidth
                  },
                  loading: false
                })
                // 下滑到指定位置
                wx.pageScrollTo({ scrollTop: top, duration: 0 })
              }
            })
          } else {
            // 动态计算最大页数
            wx.createSelectorQuery()
              .select('#content-out')
              .boundingClientRect(function(rect) {
                // 获取屏幕高度和宽度信息
                wx.getSystemInfo({
                  success: function(res) {
                    self.setData({
                      maxPageNum: Math.ceil(rect.height / parseInt(res.windowHeight - 20)),
                      useTransition: false,
                      leftValue: -1 * (res.windowWidth - 10) * (parseInt(self.data.pageIndex || 1) - 1),
                      windows: {
                        windows_height: res.windowHeight,
                        windows_width: res.windowWidth
                      },
                      hasGotMaxNum: true,
                      loading: false
                    })
                  }
                })
              })
              .exec()
          }
          // 初始化好了之后开始计时
          readTimer = new Interval(
            function() {
              self.setData({ hasReadTime: self.data.hasReadTime + 10 * 1000 })
            },
            { lifetime: 864000000, delay: 10 * 1000 }
          )
          readTimer.start()
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (utils.getCurrentPageUrlWithArgs().indexOf('/loading/loading?need_login_again=1') < 0) {
            wx.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          }
          self.setData({ loading: false, loadFail: true })
        } else {
          // 展示无数据按钮
          self.setData({ loading: false, loadFail: true })
          
          self.showToast('获取章节内容失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        self.setData({ loading: false, loadFail: true })
        
        self.showToast('获取章节内容失败', 'bottom')
      }
    })
  },
  updateRead: function(setting) {
    var self = this
    // const bookid = self.data.bookid
    // const factionName = self.data.factionName
    var sendRequest = function(leftValue) {
      wx.request({
        method: 'POST',
        url: config.base_url + '/api/booklist/update_read',
        header: { Authorization: 'Bearer ' + app.globalData.token },
        data: {
          bookid: self.data.bookid,
          chapter_num: self.data.currentSectionNum,
          chapter_page_index: self.data.pageIndex,
          chapter_page_top: leftValue,
          read_time: self.data.hasReadTime,
          setting: setting
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
            
            self.showToast('更新阅读进度失败', 'bottom')
          }
        },
        fail: err => {
          
          self.showToast('更新阅读进度失败', 'bottom')
        }
      })
    }
    // 如果是上下翻页的模式滑动距离要动态计算
    if (self.data.overPage === 1) {
      sendRequest(scrollTopValue)
    } else {
      sendRequest(self.data.leftValue)
    }
  },
  closeReaderTips: function() {
    var self = this
    self.setData({ showReaderTips: false })
    wx.setStorageSync('show_reader_tips', false)
  },
  searchInputKeyDown: function(event) {
    this.setData({ searchInputValue: event.detail.value })
  },
  clickSearchInputClose: function() {
    let tmp = {}
    tmp.searchInputValue = ''
    tmp.showLookMoreChapter = true
    if (hasRunSearchInputConfrim) {
      if (sectionDataBeforeSearch && sectionDataBeforeSearch.length > 0) {
        tmp.allSectionData = sectionDataBeforeSearch
        tmp.searchTopValue = scrollTopBeforeSearch
      }
    } else {
      hasRunSearchInputConfrim = false
    }
    this.setData(tmp)
  },
  searchChapter: function(event) {
    var self = this
    // 禁止关键字为空的搜索
    if (!event.detail.value) {
      return false
    }
    let query = wx.createSelectorQuery()
    query.select('#sections').scrollOffset()
    query.exec(res => {
      scrollTopBeforeSearch = res[0].scrollTop
    });
    wx.request({
      url: config.base_url + '/api/chapter/search?bookid=' + self.data.bookid + '&str=' + event.detail.value,
      success: res => {
        if (res.data.ok) {
          hasRunSearchInputConfrim = true
          self.setData({ allSectionData: res.data.data, showLookMoreChapter: false })
        } else {
          
          self.showToast('未找到相应章节' + (res.data.msg ? '，' + res.data.msg : ''), 'center')
        }
      },
      fail: err => {
        
        self.showToast('未找到相应章节', 'center')
      }
    })
  },
  closeMulu: function(event) {
    var x = event.detail.x
    var w = this.data.windows.windows_width * 0.92
    if (x > w) {
      // 显示控制栏
      this.setData({
        control: {
          all: 0,
          control_tab: 0,
          control_detail: 0,
          target: this.data.control.target || 'color'
        },
        isShowMulu: 0
      })
    }
  },
  loadPreChapter: function() {
    let self = this
    self.setData({ backupSectionNum: self.data.currentSectionNum })
    let callback = function(res, isLoadCallback) {
      if (res.data.ok) {
        self.setData({
          bindTopValue: 0,
          currentSectionNum: res.data.data.num,
          content: ' ' + res.data.data.content.replace(/[\r\n]+\s*/g, '\n '),
          factionTitle: res.data.data.name,
          'allSliderValue.section': res.data.data.num,
          hasGotMaxNum: false,
          pageIndex: 1, // 将pageIndex重置为第一页
          leftValue: 0, // 左滑值重置为0
          isShowBuy: !res.data.canRead,
          beforeLoaded: false,
          beforeData: '',
          afterLoaded: false,
          afterData: ''
        })
        if (res.data.canRead && res.data.doAutoBuy) {
          self.showToast('已为您自动给购买该章节', 'bottom')
        }
        // 设置标题
        wx.setNavigationBarTitle({
          title: '第' + res.data.data.num + '章 ' + res.data.data.name
        })
        // 如果为上下翻页，则不需要重新计算最大分页数
        if (self.data.overPage === 1) {
          wx.pageScrollTo({ scrollTop: 0, duration: 0 })
        } else {
          // 重新计算最大分页数
          wx.createSelectorQuery()
            .select('#content-out')
            .boundingClientRect(function(rect) {
              var maxPageNum = Math.ceil(rect.height / parseInt(self.data.windows.windows_height - 20))
              self.setData({
                maxPageNum: maxPageNum,
                pageIndex: maxPageNum, // 往前翻页，讲pageIndex重置为最后一页
                useTransition: false,
                leftValue: -1 * (self.data.windows.windows_width - 10) * (maxPageNum - 1),
                hasGotMaxNum: true
              })
            })
            .exec()
        }
      } else if (res.data.authfail) {
        // 防止多个接口失败重复打开重新登录页面
        if (utils.getCurrentPageUrlWithArgs().indexOf('/loading/loading?need_login_again=1') < 0) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        }
        if (!isLoadCallback) {
          self.setData({ loadFail: true })
        }
      } else {
        if (!isLoadCallback) {
          self.setData({ loadFail: true })
        }
        
        self.showToast('加载上一章失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
      }
    }
    if (self.data.beforeLoaded && self.data.beforeData) {
      callback(self.data.beforeData, true)
      self.setData({ beforeLoaded: false, beforeData: '' })
      return
    }
    let preChapterNum = parseInt(self.data.currentSectionNum) - 1
    if (preChapterNum > 0) {
      self.setData({ loading: true })
      wx.request({
        method: 'GET',
        url: config.base_url + '/api/chapter/detail?bookid=' + self.data.bookid + '&chapter_num=' + preChapterNum,
        header: {
          Authorization: 'Bearer ' + app.globalData.token
        },
        success(res) {
          callback(res)
          self.setData({ loading: false })
        },
        fail(err) {
          self.setData({ loading: false, loadFail: true })
          
          self.showToast('加载上一章失败，', 'bottom')
        }
      })
    } else {
      self.showToast('已经翻到最前面了', 'bottom')
    }
  },
  loadBefore: function() {
    let self = this
    let preChapterNum = parseInt(self.data.currentSectionNum) - 1
    if (preChapterNum > 0 && !self.data.beforeLoaded) {
      wx.request({
        method: 'GET',
        url: config.base_url + '/api/chapter/detail?bookid=' + self.data.bookid + '&chapter_num=' + preChapterNum,
        header: { Authorization: 'Bearer ' + app.globalData.token },
        success(res) {
          if (res.data.ok) {
            // 存储获得接口数据
            self.setData({ beforeLoaded: true, beforeData: res })
          }
        }
      })
    }
  },
  // loadBefore代表提前加载，页面的内容不会立即被修改
  loadNextChapter: function() {
    let self = this
    self.setData({ backupSectionNum: self.data.currentSectionNum })
    let callback = function(res, isLoadCallback) {
      if (res.data.ok) {
        self.setData({
          bindTopValue: 0,
          currentSectionNum: res.data.data.num,
          content: ' ' + res.data.data.content.replace(/[\r\n]+\s*/g, '\n '),
          factionTitle: res.data.data.name,
          'allSliderValue.section': res.data.data.num,
          hasGotMaxNum: false,
          pageIndex: 1, // 将pageIndex重置为第一页
          useTransition: false,
          leftValue: 0, // 左滑值重置为0
          isShowBuy: !res.data.canRead,
          beforeLoaded: false,
          beforeData: '',
          afterLoaded: false,
          afterData: ''
        })
        if (res.data.canRead && res.data.doAutoBuy) {
          self.showToast('已为您自动给购买该章节', 'bottom')
        }
        // 设置标题
        wx.setNavigationBarTitle({
          title: '第' + res.data.data.num + '章 ' + res.data.data.name
        })
        // 如果为上下翻页，则不需要重新计算最大分页数
        if (self.data.overPage === 1) {
          wx.pageScrollTo({ scrollTop: 0, duration: 0 })
        } else {
          // 重新计算最大分页数
          wx.createSelectorQuery()
            .select('#content-out')
            .boundingClientRect(function(rect) {
              self.setData({
                maxPageNum: Math.ceil(rect.height / parseInt(self.data.windows.windows_height - 20)),
                hasGotMaxNum: true
              })
            })
            .exec()
        }
      } else if (res.data.authfail) {
        // 防止多个接口失败重复打开重新登录页面
        if (utils.getCurrentPageUrlWithArgs().indexOf('/loading/loading?need_login_again=1') < 0) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        }
        if (!isLoadCallback) {
          self.setData({ loadFail: true })
        }
      } else {
        if (!isLoadCallback) {
          self.setData({ loadFail: true })
        }
        
        self.showToast('加载下一章失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
      }
    }
    // 如果已经存在预加载数据，则不重新发送请求
    if (self.data.afterLoaded && self.data.afterData) {
      callback(self.data.afterData, true)
      self.setData({ afterLoaded: false, afterData: '' })
      return
    }
    let nextChapterNum = parseInt(self.data.currentSectionNum) + 1
    if (nextChapterNum <= self.data.newestSectionNum) {
      self.setData({ loading: true })
      wx.request({
        method: 'GET',
        url: config.base_url + '/api/chapter/detail?bookid=' + self.data.bookid + '&chapter_num=' + nextChapterNum,
        header: { Authorization: 'Bearer ' + app.globalData.token },
        success(res) {
          callback(res)
          self.setData({ loading: false })
        },
        fail(err) {
          self.setData({ loading: false, loadFail: true })
          
          self.showToast('加载下一章失败', 'bottom')
        }
      })
    } else {
      // 判断是否是连载书籍，如果是则提示订阅书籍
      if (self.data.updateStatus === '连载中') {
        if (!self.data.hasRssTheBook) {
          wx.showModal({
            title: '温馨提示',
            content: '你已经阅读到了最后一章，如果喜欢这本书，可以点击下方按钮订阅本书。书籍章节更新时我们会在第一时间通知你.~',
            confirmText: '订阅本书',
            confirmColor: '#1AAD19',
            success(res) {
              if (res.confirm) {
                wx.request({
                  method: 'POST',
                  url: config.base_url + '/api/booklist/rss',
                  header: { Authorization: 'Bearer ' + app.globalData.token },
                  data: {
                    bookid: self.data.bookid,
                    rss: 1
                  },
                  success: function(res) {
                    if (res.data.ok) {
                      wx.showToast({
                        icon: 'success',
                        title: '订阅成功'
                      })
                      let hasRssBookArr = wx.getStorageSync('hasRssBookArr') || []
                      if (hasRssBookArr.indexOf(self.data.bookid) < 0) {
                        hasRssBookArr.push(self.data.bookid)
                        wx.setStorageSync('hasRssBookArr', hasRssBookArr)
                      }
                    } else if (res.data.authfail) {
                      wx.navigateTo({
                        url: '../loading/loading?need_login_again=1'
                      })
                    } else {
                      
                      self.showToast(res.data.msg || '订阅书籍失败，请重试', 'bottom')
                    }
                  },
                  fail: function(err) {
                    
                    self.showToast('订阅书籍失败，请重试', 'bottom')
                  }
                })
              }
            }
          })
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
    }
  },
  // 预加载下一章
  loadAfter: function() {
    let self = this
    let nextChapterNum = parseInt(self.data.currentSectionNum) + 1
    if (nextChapterNum <= self.data.newestSectionNum && !self.data.afterLoaded) {
      wx.request({
        method: 'GET',
        url: config.base_url + '/api/chapter/detail?bookid=' + self.data.bookid + '&chapter_num=' + nextChapterNum,
        header: { Authorization: 'Bearer ' + app.globalData.token },
        success(res) {
          if (res.data.ok) {
            // 存储获得接口数据
            self.setData({ afterLoaded: true, afterData: res })
          }
        }
      })
    }
  },
  // 购买该章节
  buyChapter: function() {
    let self = this
    wx.request({
      url: config.base_url + '/api/chapter/buy?bookid=' + self.data.bookid + '&chapter_num=' + self.data.currentSectionNum,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          // 隐藏购买提示
          self.setData({
            isShowBuy: false
          })
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (utils.getCurrentPageUrlWithArgs().indexOf('/loading/loading?need_login_again=1') < 0) {
            wx.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          }
        } else {
          // 费用不足
          if (res.data.nomoney) {
            self.setData({
              modal: {
                show: true,
                name: 'buyfail',
                inputValue: '',
                title: '温馨提示',
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
          } else {
            
            self.showToast('购买失败' + (res.data.msg ? '，' + res.data.msg : ''), 'center')
          }
        }
      },
      fail: err => {
        
        self.showToast('购买失败', 'center')
      }
    })
  },
  // 取消购买，返回上一次阅读章节
  buyTotal: function() {
    this.setData({
      modal: {
        show: true,
        name: 'input',
        inputValue: '',
        title: '请输入您的粉丝凭证',
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
  hasSecret: function() {
    this.setData({
      'modal.title': '请输入您的粉丝凭证',
      'modal.name': 'input'
    })
  },
  // 复制微信号
  copyWxcode: function() {
    let self = this
    let globalSetting = app.globalData.globalSetting ? app.globalData.globalSetting.wxcode : 'bcydushu'
    wx.setClipboardData({
      data: globalSetting.wxcode || 'haitianyise_hl',
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
  bindKeyInput: function(e) {
    this.setData({
      'modal.inputValue': e.detail.value
    })
  },
  finishSecretInput: function() {
    let self = this
    if (!self.data.modal.inputValue) {
      self.showToast('请输入粉丝凭证', 'bottom')
      return false
    }
    wx.request({
      url: config.base_url + '/api/secret/open?bookid=' + self.data.bookid + '&secret=' + self.data.modal.inputValue,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          // 隐藏购买提示
          self.setData({
            'modal.show': false
          })
          self.initPage(self.data.currentSectionNum)
          wx.showToast({ title: '开始阅读吧~', icon: 'success' })
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (utils.getCurrentPageUrlWithArgs().indexOf('/loading/loading?need_login_again=1') < 0) {
            wx.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          }
        } else {
          self.showToast((res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        
        self.showToast('请重试', 'bottom')
      }
    })
  },
  // 取消购买，返回上一次阅读章节
  buyCancel: function() {
    this.initPage(this.data.backupSectionNum - 1 > 0 ? this.data.backupSectionNum - 1 : 1)
  },
  gotoAccount: function() {
    wx.navigateTo({
      url: '../account/account'
    })
  },
  gotoAttendance: function() {
    wx.navigateTo({
      url: '../attendance/attendance'
    })
  },
  loadAgain: function() {
    let self = this
    self.setData({ loadFail: false })
    self.initPage(self.data.currentSectionNum)
  },
  showToast: function(content, position) {
    let self = this
    self.setData({
      toast: {
        show: true,
        content: content,
        position: position
      }
    })
    setTimeout(function() {
      self.setData({
        toast: {
          show: false,
          content: '',
          position: 'bottom'
        }
      })
    }, 3000)
  }
})
