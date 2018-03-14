// classify.js
const config = require('../../config')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    classifyTypes: ['玄幻·奇幻', '修真·仙侠', '都市·青春', '历史·军事', '网游·竞技', '科幻·灵异', '言情·穿越', '耽美·同人', '侦探·推理'],
    page: 1,
    total: 0,
    classifyData: [],
    currentIndex: 0,
    scrollTop: { scrollTop_value: 0, backTop_show: false }
  },
  onLoad: function (options) {
    var self = this
    //根据url中传过来的分类index，加载指定的分类数据，index默认值1
    if(options.index){
      self.setData({ 'currentIndex':  options.index})
      self.getClassifyData(options.index, self.data.page)
    }else{
      self.getClassifyData(self.data.currentIndex, self.data.page)
    }
  },
  getClassifyData: function(index, page, isLoadMore){
    //显示加载中
    wx.showToast({ title: '加载中', icon: 'loading' })
    let self = this
    if(!isLoadMore){
      page = 1
      self.setData({ 'page': 1 })
    }
    wx.request({
      url: config.base_url + '/api/book/classify?index=' + index + '&page=' + page,
      header: { 'content-type': 'application/json' },
      success: function (res) {
        //隐藏加载信息
        setTimeout(function () { wx.hideToast() }, 300)
        if (res.data.ok) {
          if(isLoadMore){
            self.setData({ classifyData: self.data.classifyData.concat(res.data.list), total: res.data.total })
          }else{
            self.setData({ classifyData: res.data.list, total: res.data.total })
          }
        } else {
          if (res.data.msg) {
            self.showToast(res.data.msg, 'bottom')
          }
        }
      },
      error: function (err) {
        setTimeout(function () {
          wx.hideToast()
          self.showToast('获取分类数据失败~', 'bottom')
        }, 500)
      }
    })
  },
  showClassify: function (event) {
    this.setData({ currentIndex: event.currentTarget.dataset.index });
    this.getClassifyData(this.data.currentIndex, this.data.page)
  },
  loadMoreData: function (event) {
    let page = this.data.page + 1
    if(page >= (Math.ceil(this.data.total / 8)+1)){
      this.showToast('暂无更多数据~', 'bottom')
    }else{
      this.setData({ 'page': page })
      this.getClassifyData(this.data.currentIndex, this.data.page, true)
    }
  },
  backToTop: function () {
    var topValue = this.data.scrollTop.scrollTop_value //发现设置scroll-top值不能和上一次的值一样，否则无效，所以这里加了个判断  
    if (topValue == 1) {
      topValue = 0
    } else {
      topValue = 1
    }
    this.setData({
      'scrollTop.scrollTop_value': topValue
    })
  },
  reloadData: function () {
    this.getClassifyData(this.data.currentIndex, this.data.page)
  },
  // 弹出消息函数
  showToast: function (content, position) {
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function () {
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
});
