//attendance.js
const config = require('../../config')
const app = getApp()
let choose_year = null
let choose_month = null

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    hasEmptyGrid: false,
    showPicker: false,
    hasDone: false,
    keepTimes: 0,
    present: 0,
    records: [],
    statusText: ''
  },
  onShow: function() {
    // 获取我的签到记录
    this.getMyAttendance()
  },
  onLoad: function() {
    const date = new Date()
    const cur_year = date.getFullYear()
    const cur_month = date.getMonth() + 1
    const weeks_ch = ['日', '一', '二', '三', '四', '五', '六']
    this.calculateEmptyGrids(cur_year, cur_month)
    this.calculateDays(cur_year, cur_month)
    this.setData({
      cur_year,
      cur_month,
      weeks_ch
    })
  },
  getThisMonthDays(year, month) {
    return new Date(year, month, 0).getDate()
  },
  getFirstDayOfWeek(year, month) {
    return new Date(Date.UTC(year, month - 1, 1)).getDay()
  },
  calculateEmptyGrids(year, month) {
    const firstDayOfWeek = this.getFirstDayOfWeek(year, month)
    let empytGrids = []
    if (firstDayOfWeek > 0) {
      for (let i = 0; i < firstDayOfWeek; i++) {
        empytGrids.push(i)
      }
      this.setData({
        hasEmptyGrid: true,
        empytGrids
      })
    } else {
      this.setData({
        hasEmptyGrid: false,
        empytGrids: []
      })
    }
  },
  calculateDays(year, month) {
    let self = this
    let days = []
    const thisMonthDays = self.getThisMonthDays(year, month)
    for (let i = 1; i <= thisMonthDays; i++) {
      days.push({
        day: i,
        choosed: false
      })
    }
    // 标记已经签到的日子
    month = month <= 9 ? '0' + month : month
    self.data.records.forEach(item => {
      days.forEach((dayItem, dayIndex) => {
        let day = dayItem.day <= 9 ? '0' + dayItem.day : dayItem.day
        let key = 'days[' + dayIndex + '].choosed'
        if (year + '/' + month + '/' + day === item) {
          days[dayIndex].choosed = true
        }
      })
    })
    self.setData({
      days
    })
  },
  handleCalendar(e) {
    const handle = e.currentTarget.dataset.handle
    const cur_year = this.data.cur_year
    const cur_month = this.data.cur_month
    if (handle === 'prev') {
      let newMonth = cur_month - 1
      let newYear = cur_year
      if (newMonth < 1) {
        newYear = cur_year - 1
        newMonth = 12
      }

      this.setData({
        cur_year: newYear,
        cur_month: newMonth
      })

      this.calculateDays(newYear, newMonth)
      this.calculateEmptyGrids(newYear, newMonth)
    } else {
      let newMonth = cur_month + 1
      let newYear = cur_year
      if (newMonth > 12) {
        newYear = cur_year + 1
        newMonth = 1
      }

      this.setData({
        cur_year: newYear,
        cur_month: newMonth
      })

      this.calculateDays(newYear, newMonth)
      this.calculateEmptyGrids(newYear, newMonth)
    }
  },
  tapDayItem(e) {
    const idx = e.currentTarget.dataset.idx
    const days = this.data.days
    days[idx].choosed = !days[idx].choosed
    this.setData({
      days
    })
  },
  chooseYearAndMonth() {
    const cur_year = this.data.cur_year
    const cur_month = this.data.cur_month
    let picker_year = []
    let picker_month = []
    for (let i = 1900; i <= 2100; i++) {
      picker_year.push(i)
    }
    for (let i = 1; i <= 12; i++) {
      picker_month.push(i)
    }
    const idx_year = picker_year.indexOf(cur_year)
    const idx_month = picker_month.indexOf(cur_month)
    this.setData({
      picker_value: [idx_year, idx_month],
      picker_year,
      picker_month,
      showPicker: true
    })
  },
  pickerChange(e) {
    const val = e.detail.value
    choose_year = this.data.picker_year[val[0]]
    choose_month = this.data.picker_month[val[1]]
  },
  tapPickerBtn(e) {
    const type = e.currentTarget.dataset.type
    const o = {
      showPicker: false
    }
    if (type === 'confirm') {
      o.cur_year = choose_year
      o.cur_month = choose_month
      this.calculateEmptyGrids(choose_year, choose_month)
      this.calculateDays(choose_year, choose_month)
    }

    this.setData(o)
  },
  doAttendance() {
    let self = this
    wx.request({
      method: 'GET',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      url: config.base_url + '/api/attendance',
      success: res => {
        if (res.data.ok) {
          self.setData({ hasDone: true, keepTimes: res.data.keep_times, records: res.data.records, present: res.data.present })
          self.calculateEmptyGrids(self.data.cur_year, self.data.cur_month)
          self.calculateDays(self.data.cur_year, self.data.cur_month)
          wx.showToast({ title: '签到成功', icon: 'success' })
          setTimeout(function() {
            wx.hideToast()
          }, 1000)
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('获取签到记录失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取签到记录失败', 'bottom')
      }
    })
  },
  getMyAttendance() {
    let self = this
    wx.request({
      method: 'GET',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      url: config.base_url + '/api/attendance/me',
      success: res => {
        if (res.data.ok) {
          // 设定statusText
          let statusText = ''
          if (res.data.keep_times >= 0 && res.data.keep_times < 3) {
            statusText = '还差' + (3 - res.data.keep_times) + '天获得100积分'
          } else if (res.data.keep_times >= 3 && res.data.keep_times < 15) {
            statusText = '还差' + (15 - res.data.keep_times) + '天获得150积分'
          } else if (res.data.keep_times >= 15 && res.data.keep_times < 30) {
            statusText = '还差' + (30 - res.data.keep_times) + '天获得200积分'
          }
          self.setData({ hasDone: res.data.has_done, keepTimes: res.data.keep_times, records: res.data.records, present: res.data.present, statusText: statusText })
          self.calculateEmptyGrids(self.data.cur_year, self.data.cur_month)
          self.calculateDays(self.data.cur_year, self.data.cur_month)
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('获取签到记录失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取签到记录失败', 'bottom')
      }
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
