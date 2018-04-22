//bookdetail.js
const config = require('../../config')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    detail: {},
    isInList: false,
    bookid: '',
    showAllDes: false,
    comments: [],
    commentInputHide: true,
    commentType: null, // 评论类型，是回复别人还是评论书籍
    currentCommentValue: ''
  },
  onLoad: function (options) {
    let self = this
    wx.setNavigationBarTitle({ title: options.name })
    wx.showNavigationBarLoading()
    self.getBookDetail(options.id)
    self.getCommentList(options.id)
    self.setData({ bookid: options.id })
  },
  getBookDetail: function(id){
    let self = this
    if(id){
      wx.request({
        url: config.base_url + '/api/book/get_detail?id=' + id,
        header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
        success: function(res){
          if(res.data.ok){
            // devide des into shortDes and des;
            let shortDes = ''
            // format des
            let des = res.data.data.des
            res.data.data.des = des.replace(/( ){2,}/, ' ');
            if (des.length > 95) {
              shortDes = des.substring(0, 70) + '...';
            }
            res.data.data.shortDes = shortDes;
            self.setData({ 'detail': res.data.data, isInList: res.data.isInList })
                
            wx.hideNavigationBarLoading()
          }else{
            self.showToast('获取书籍信息失败~', 'bottom')
          }
        },
        fail: function(err){
          self.showToast('获取书籍信息失败~', 'bottom')
        }
      })
    }else{
      self.showToast('获取书籍信息失败~', 'bottom')
    }
  },
  getCommentList: function(id){
    let self = this
    if(id){
      wx.request({
        url: config.base_url + '/api/comment/list?bookid=' + id,
        header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
        success: res => {
          if(res.data.ok){
            res.data.list = res.data.list.map(item => {
              item.isOpenMoreComment = false
              return item
            })
            self.setData({ 'comments': res.data.list })
          }else{
            self.showToast(res.data.msg || '获取评论失败~', 'bottom')
          }
        },
        fail: err => {
          self.showToast('获取评论失败~', 'bottom')
        }
      })
    }
  },
  showAllDes: function () {
    if (this.data.detail.shortDes) {
      if (this.data.showAllDes) {
        this.setData({showAllDes: false})
      } else {
        this.setData({showAllDes: true})
      }
    }
  },
  addOrRemove: function(){
    let self = this
    if(self.data.isInList){
      wx.request({
        url: config.base_url + '/api/booklist/remove_book?id=' + self.data.bookid,
        header: {
          'Authorization': 'Bearer ' + wx.getStorageSync('token')
        },
        success: function(res){
          if(res.data.ok){
            self.showToast('从书架中移除成功', 'bottom')
            self.setData({isInList: false})
          }else{
            self.showToast(res.data.msg || '从书架中移除失败，请重新尝试~', 'bottom')
          }
        },
        fail: function(err){
          self.showToast('从书架中移除失败，请重新尝试~', 'bottom')
        }
      })
    }else{
      wx.request({
        url: config.base_url + '/api/booklist/add_book?id=' + self.data.bookid,
        header: {
          'Authorization': 'Bearer ' + wx.getStorageSync('token')
        },
        success: function(res){
          if(res.data.ok){
            wx.showToast({title: '加入书架成功', icon: 'success'})
            self.setData({isInList: true})
          }else{
            self.showToast(res.data.msg || '加入书架失败，请重新尝试~', 'bottom')
          }
        },
        fail: function(err){
          self.showToast('加入书架失败，请重新尝试~', 'bottom')
        }
      })
    }
  },
  addLikeNum: function(event){
    let self = this
    let commentid = event.currentTarget.dataset.commentid
    let index = event.currentTarget.dataset.index
    wx.request({
      url: config.base_url + '/api/comment/like?commentid=' + commentid + '&op=' + (self.data.comments[index].is_like ? 'remove' : 'add'),
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      success: res => {
        if(res.data.ok){
          let key1 = 'comments[' + index + '].like_num'
          let key2 = 'comments[' + index + '].is_like'
          self.setData({[key1]: res.data.current, [key2]: (self.data.comments[index].is_like ? false : true)})
        }else{
          self.showToast(res.data.msg || '点赞失败~', 'bottom')
        }
      },
      fail: err => {
        self.showToast(res.data.msg || '点赞失败~', 'bottom')
      }
    })
  },
  readMoreComments: function (event) {
    let self = this
    let commentid = event.currentTarget.dataset.commentid
    let index = event.currentTarget.dataset.index
    let key = 'comments[' + index + '].isOpenMoreComment'
    self.setData({[key]: !self.data.comments[index].isOpenMoreComment})
  },
  toWriteComment: function (event) {
    let self = this
    if(event.currentTarget.id == 'write'){
      self.setData({commentInputHide: false})
    }else{
      let commentid = event.currentTarget.dataset.commentid
      let username = event.currentTarget.dataset.username
      self.setData({commentInputHide: false, commentType: {id: commentid, username: username}});
    }
  },
  hideCommentBar: function () {
    this.setData({commentInputHide: true})
  },
  stageCommentValue: function (e) {
    this.setData({currentCommentValue: e.detail.value})
  },
  sendComment: function(event){
    let self = this
    let content = event.detail.value
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/comment/add',
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      data: {
        bookid: self.data.bookid,
        content: content,
        father: self.data.commentType ? self.data.commentType.id : ''
      },
      success: res => {
        if(res.data.ok){
          wx.showToast({title: '发布书评成功', icon: 'success'})
          let comments = self.data.comments
          comments.unshift(res.data.data)
          // 清空当前评论内容，并修改comments
          self.setData({'comments': comments, 'currentCommentValue': ''})
          
        }else{
          self.showToast( res.data.msg || '发布书评失败~', 'bottom')  
        }
      },
      fail: err => {
        self.showToast('发布书评失败~', 'bottom')
      }
    })
  },
  goToReader: function(){
    wx.navigateTo({ url: '../reader/reader?bookid=' + this.data.bookid})
  },
  showToast: function(content, position){
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function(){
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
