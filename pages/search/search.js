const config = require('../../config')
const utils = require('../../utils/util')

var app = getApp()
Page({
  data: {
    keywrod: '',
    searchStatus: false,
    goodsList: [],
    helpKeyword: [],
    historyKeyword: [],
    categoryFilter: false,
    currentSortType: 'default',
    currentSortOrder: '',
    filterCategory: [],
    defaultKeyword: '',
    hotKeyword: [],
    page: 1,
    size: 20,
    currentSortType: 'id',
    currentSortOrder: 'desc',
    categoryId: 0
  },
  //事件处理函数
  closeSearch: function() {
    wx.navigateBack()
  },
  clearKeyword: function() {
    this.setData({
      keyword: '',
      searchStatus: false
    })
  },
  onLoad: function() {
    this.getSearchKeyword()
    // 当前页面不予许分享
    wx.hideShareMenu()
  },
  getSearchKeyword() {
    let self = this
    wx.request({
      url: config.base_url + '/api/book/search_hot',
      method: 'GET',
      success: function(res) {
        self.setData({
          historyKeyword: wx.getStorageSync('history_keyword'),
          defaultKeyword: res.data.default || '请输入搜索关键字',
          hotKeyword: res.data.list
        })
      }
    })
  },
  inputChange: function(e) {
    this.setData({
      keyword: e.detail.value,
      searchStatus: false
    })
    this.getHelpKeyword()
  },
  getHelpKeyword: function() {
    let self = this
    wx.request({
      url: config.base_url + '/api/book/search_help',
      header: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      method: 'POST',
      data: {
        keyword: self.data.keyword.trim()
      },
      success: function(res) {
        if (res.data.ok) {
          self.setData({
            helpKeyword: res.data.list
          })
        }
      }
    })
  },
  inputFocus: function() {
    this.setData({
      searchStatus: false,
      goodsList: []
    })

    if (this.data.keyword) {
      this.getHelpKeyword()
    }
  },
  clearHistory: function() {
    this.setData({
      historyKeyword: []
    })
    wx.removeStorageSync('history_keyword')
  },
  getGoodsList: function() {
    let self = this
    wx.request({
      url: config.base_url + '/api/book/search',
      header: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      method: 'POST',
      data: {
        keyword: self.data.keyword.trim()
      },
      success: function(res) {
        if (res.data.ok) {
          self.setData({
            searchStatus: true,
            categoryFilter: false,
            goodsList: res.data.list,
            filterCategory: res.data.classification.map((item, index) => {
              return {
                name: item,
                index: index,
                checked: false
              }
            })
          })
        } else {
          utils.debug('搜索书籍失败', res)
          self.showToast('搜索书籍失败', 'bottom')
        }
        // 写入搜索历史
        let oldHistory = wx.getStorageSync('history_keyword') || []
        if (oldHistory.indexOf(self.data.keyword.trim()) < 0) {
          oldHistory.push(self.data.keyword.trim())
          wx.setStorageSync('history_keyword', oldHistory)
        }
      },
      fail: function(err) {
        utils.debug('搜索书籍失败', err)
        self.showToast('搜索书籍失败', 'bottom')
      }
    })
  },
  onKeywordTap: function(event) {
    this.getSearchResult(event.target.dataset.keyword)
  },
  getSearchResult(keyword) {
    this.setData({
      keyword: keyword,
      page: 1,
      categoryId: 0,
      goodsList: []
    })

    this.getGoodsList()
  },
  openSortFilter: function(event) {
    let currentId = event.currentTarget.id
    switch (currentId) {
      case 'categoryFilter':
        this.setData({
          categoryFilter: !this.data.categoryFilter,
          currentSortOrder: 'asc'
        })
        break
      case 'priceSort':
        let tmpSortOrder = 'asc'
        if (this.data.currentSortOrder == 'asc') {
          tmpSortOrder = 'desc'
        }
        this.setData({
          currentSortType: 'price',
          currentSortOrder: tmpSortOrder,
          categoryFilter: false
        })

        this.getGoodsList()
        break
      default:
        //综合排序
        this.setData({
          currentSortType: 'default',
          currentSortOrder: 'desc',
          categoryFilter: false
        })
        this.getGoodsList()
    }
  },
  selectCategory: function(event) {
    let currentIndex = event.target.dataset.categoryIndex
    let filterCategory = this.data.filterCategory
    filterCategory.forEach(item => {
      if (item.index === currentIndex) {
        item.checked = true
      } else {
        item.checked = false
      }
    })
    this.setData({
      filterCategory: filterCategory,
      categoryFilter: false,
      page: 1,
      goodsList: []
    })
    this.getGoodsList()
  },
  onKeywordConfirm(event) {
    this.getSearchResult(event.detail.value)
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
