//reader.js
const config = require('../../config')
const app = getApp()

var currentGesture = 0 //控制当一个手势进行的时候屏蔽其他的手势
var leftMoveTimer = null //控制左滑的动画计时器
var rightMoveTimer = null //控制右滑的动画计时器
var isMoving = 0
var leftTimmerCount = 0
var rightTimmerCount = 0
var hasRunTouchMove = false
var currentPageIndex = 0 // 当前是分栏的第几页

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
    headImg: '', // 小说图像
    factionTitle: '',
    content:
      '第一千四百一十二章\n\n\n当牧尘的身影落在了黑光长老所在的那座白玉石台时，整个天地间，依旧还处于先前的震撼之中，所有人都是一片沉默。\n\n这种沉默持续了许久，终于是有着人有些艰难的开口喃喃道：“那是...传闻中大千世界三十六道绝世神通之一的八部浮屠吧？”\n\n在场的这些各方超级势力，自然也是阅历非凡，所以很快的，也是渐渐的认出了先前牧尘所施展出来的那惊天动地的神通。\n\n那道幽黑光束所具备的毁灭力，看得众多天至尊都是头皮发麻，而如此威能的神通之术，除了那名震大千世界的三十六道绝世神通外，还能是什么？\n\n“没想到，他竟然真的将八部浮屠修炼成功了。”那些浮屠古族的长老，特别是玄脉与墨脉的，更是眼睛通红，无比嫉妒的望着牧尘，那模样，仿佛是恨不得将这般神通抢夺过来一般。\n\n因为身为天至尊，他们非常清楚那三十六道绝世神通对于他们而言究竟代表着什么，若是拥有，他们同样是能够无敌于同级之中。\n\n想想看，大千世界究竟有多少天至尊，然而那最顶尖的神通，却唯有这三十六道，由此可见其价值。\n\n就算是他们浮屠古族这深不可测的底蕴，能够媲美这三十六道绝世神通的神通之术，都是屈指可数。\n\n在那先前牧尘所在的山峰，清霜玉手紧紧的捂住嘴巴，此时的激动，连她素来的冰冷都是再维持不住，娇躯颤抖。\n\n原本以为他们清脉此次将会是毁灭般的打击，但谁料到竟会峰回路转，牧尘的横空出世，居然有着要将这般大势扭转过来的迹象。\n\n“牧尘，加油啊！”清霜喃喃道。\n\n在她身旁，灵溪倒是微笑着拍了拍她的香肩，让得后者有些不好意思的一笑，渐渐的冷静下来。\n\n“灵溪姐，牧尘能赢吗？”清霜带着一丝期盼的问道，虽然她知道，即便赢了两场，但牧尘接下来要面对的对手，却会更强。\n\n灵溪清浅一笑，温婉优雅，道：“放心吧，牧尘既然会出手，那自然有着他的把握，我们只需要等着便行了。”\n\n清霜用力的点了点头，美目凝视着远处那道身影，眸子中异彩流溢。\n\n而在另外一座山峰上，林静拍着玉手用力的鼓掌，笑盈盈的道：“牧尘赢得太漂亮了。”\n\n这两场战斗，牧尘完全没有丝毫试探的意思，一出手便是倾尽全力，甚至不惜暴露底牌，而如此一来，那战绩也是辉煌震撼得很，两招下来，赢得干脆利落，让人看得也是有些热血沸腾。\n\n一旁的萧潇也是螓首轻点，眸子中满是欣赏之色。\n\n“看来牧尘对这浮屠古族怨气很大啊。”倒是一旁的药尘呵呵一笑，他的眼力何等的老辣，一眼就看了出来，这是牧尘故意为之，因为他今日而来，本就是为了心中那口隐忍二十多年的一口气，这口气，为了他，为了他那夫妻分离，孤寂多年的爹，也为了他那被囚禁多年，不见天日的母亲，所以他要的胜利，不是那种势均力敌的激战，而是干脆利落，雷霆万钧。\n\n这样一来，那玄脉的脸面，可就丢得有点大了。\n\n“不过这种战斗方式，只能在有着绝对把握的情况下，若是两者战斗相仿，谁先暴露底牌，怕就得失去一些先机了。”林貂也是点评道，不过虽然这样说着，他的脸庞上，同样是有着欣赏之色，因为牧尘会选择这种战斗方式，那也就说明了他对自身的一种自信。\n\n这种自信，他也曾经在林动的身上见到过。\n\n...\n\n在那沉默的天地间，白玉石台上的黑光长老，也是面色有些阴沉的望着眼前信步而来的青年，望着后者，他眼神深处，也是掠过浓浓的忌惮之色。\n\n先前牧尘展现出来的手段，不管是那诡异的紫色火炎，还是那霸道无比的八部浮屠，都让得黑光长老心中泛着一丝惧意。\n\n他的实力，比玄海，玄风都要强，乃是灵品后期，但在面对着此时锐气逼人的牧尘时，他依旧是没有多少的底气。\n\n“该死，这个家伙怎么现在变得如此之强！”\n\n黑光心中怒骂，旋即生出一些后悔之意，他后悔的并不是为什么要招惹牧尘，而是后悔当初牧尘只是大圆满时，他为何不果决一些，直接出杀手。\n\n即便不必真的将其斩杀，但起码也要将其一身修为给废了，让得他从此变成一个废物，如此的话，也就没了今日的灾劫。\n\n“你是在想为什么当初没杀了我吗？”而在黑光目光闪烁的时候，牧尘盯着他，却是一笑，说道。\n\n黑光闻言，顿时哆嗦了一下，他能够感觉到，牧尘虽然在笑，在那言语间，却是弥漫着无尽的寒气甚至杀意。\n\n不过他毕竟也是浮屠古族的长老，地位显赫，很快渐渐的平复了心情，阴沉的盯着牧尘，道：“牧尘，你做事可不要太过分了，年轻人有锐气是好事，但若是太过，恐怕就得过刚易折了。”\n\n“你玄脉若是有本事，那就折给我看看吧。”牧尘漫不经心的道。\n\n“你！”\n\n黑光一怒，但瞧得牧尘那冰冷目光时，心头又是一悸，不由得羞恼至极。\n\n“还不出手吗？”牧尘盯着他，语气淡漠，然后他伸出手掌，修长如白玉，其上灵光跳跃：“若是不出手的话，那我就要动手了。”\n\n黑光闻言，恼怒得咬牙切齿，而就当他准备运转灵力时，忽有一道传音，落入耳中：“黑光，催动秘法，全力出手，即便不胜，也要将其锐气尽挫，接下来，自会有人收拾他。”\n\n听到这道传音，黑光目光顿时一闪，眼睛不着痕迹的扫了玄脉脉首玄光一眼，这道传音，显然就是来自于后者。\n\n“要催动秘法吗？”黑光踌躇了一下，一旦如此做的话，就算是以他天至尊的恢复力，也起码得虚弱大半年的时间。\n\n不过他也明白玄光的意图，现在的牧尘锐气太甚了，他一场场的打下来，就算到时候无法取胜四场，但也足以让他们玄脉搞得灰头土脸。\n\n眼下众多超级势力在观礼，若是传出去的话，说他们玄脉，被一个罪子横扫，这无疑会将他们玄脉的颜面丢光。\n\n所以，不管如何，黑光都不能再让牧尘如先前那般取得势如破竹般的战绩。\n\n必须将其阻拦下来，破其锐气，而接下来的第四场，他们玄脉，就能够派出仙品天至尊，到时候，要收拾这牧尘，自然是易如反掌。\n\n“好！”\n\n心中踌躇了一下，黑光终于是狠狠一咬牙，在见识了先前牧尘的手段后，即便是他，也是没把握能够接下牧尘的攻势，既然如此，还不如拼命一搏。\n\n“小辈，今日就让你知晓，什么叫做过刚易折！”\n\n黑光心中冷声说道，旋即他身形陡然暴射而退，同时讥讽冷笑道：“牧尘，休要得意，今日你也接我一招试试！”\n\n轰！\n\n随着其音落，只见得黑光身后，亿万道灵光交织，一座巨大的至尊法相现出身来，浩瀚的灵力风暴，肆虐在天地间。\n\n这至尊法相一出现，黑光也是深深的吸了一口气，双手陡然结出一道古怪印法。\n\n同时，其身后的至尊法相，也是双手结印。\n\n在那远处，清天，清萱等长老见到这一幕，瞳孔顿时一缩，骇然道：“无耻！竟然是化灵秘法！”\n\n在他们骇然失声时，那黑光则是对着牧尘露出狠辣笑容，森然道：“既然你咄咄逼人，那也怪不得老夫心狠手辣了。”\n\n话音落下，他的肚子陡然鼓胀起来，同时他身后的至尊法相，也是鼓起巨大的肚子，下一刻，他张开嘴巴，猛然一吐。\n\n黑光与身后的至尊法相嘴中，竟是有着星辰般的洪流远远不断的奔腾而出，那等声势，犹如是能够磨灭万古。\n\n而随着那星河般的洪流不断的呼啸而出，只见得黑光的身躯迅速的干枯，而那至尊法相，也是开始黯淡无光，仿佛两者之中的所有力量，都是化为了那无尽星辰洪流。\n\n天地间，众多天至尊见到这一幕，都是忍不住的面色一变，失声道：“这黑光疯了，竟然将至尊法相都是分解了？！”\n\n至尊法相乃是天至尊最强的战力之一，若是自我分解，那就得再度重新凝炼，那所需要消耗的时间与精力可是不少，而且说不定还会有着损伤。\n\n所以一般这种手段，极少人会动用，那是真正的损人不利己，杀敌一千，自损一千的同归于尽之法。\n\n呼呼！\n\n天地间，星辰洪流呼啸而过，对着牧尘笼罩而去，那等威势，仿佛就算是日月，都将会被消磨而灭。\n\n众多强者神色凝重，先前牧尘的锐气太甚，所以这黑光才会以这种极端的方式，试图将其阻扰，坏其锐气，保住玄脉的颜面。\n\n“黑光可真是狠辣，这下子，那牧尘可是遇见麻烦了。”\n\n...\n\n...',
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
      button_font_color: '#0770cb'
    }, //1、2、3、4分别对应四种颜色模式
    isShowMulu: 0, // 是否显示左侧栏
    allSectionData: [], // 所有章节数据
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
    startReadTime: null, // 进入阅读器开始阅读时间
    secretTips: '',
    beforeLoaded: false, // 预加载相关变量
    beforeData: '',
    afterLoaded: '',
    afterData: '',
    loading: false, // 加载状态
    loadFail: false, // 显示加载失败页面
    useTransition: true, // 是否使用滑动的transition动画，在切换下一章的时候应该关闭
    overPage: 1 // 阅读器翻页模式
  },
  onReady: function() {
    let self = this
    // 判断是否需要显示提示
    let showReaderTips = app.globalData.showReaderTips
    if (showReaderTips || showReaderTips === '') {
      self.setData({ showReaderTips: true })
    } else {
      self.setData({ showReaderTips: false })
    }
    //读取用户设置
    let localSetting = app.globalData.userInfo || {}
    if (localSetting && localSetting.setting) {
      let userSetting = localSetting.setting
      self.setData({
        'allSliderValue.bright': userSetting.reader.bright || self.data.allSliderValue.bright,
        'allSliderValue.font': userSetting.reader.fontSize || self.data.allSliderValue.font,
        colorStyle: self.transColorStyle(userSetting.reader.mode) || self.data.colorStyle,
        currentFontFamily: userSetting.reader.fontFamily || self.data.currentFontFamily,
        overPage: userSetting.reader.overPage
      })
    }
    // 设置背景色
    wx.setNavigationBarColor({
      frontColor: self.data.colorStyle.styleNum == 4 ? '#ffffff' : '#000000',
      backgroundColor: self.data.colorStyle.control_bg,
      animation: {
        duration: 0,
        timingFunc: 'easeIn'
      },
      fail: function() {
        self.showToast('设置背景色失败', 'bottom')
      }
    })
  },
  onLoad: function(options) {
    var self = this
    //动态设置标题
    var bookid = options.bookid || '5a0d7a6ec38abf73e8e65cb3'
    var secretTips = app.globalData.globalSetting ? app.globalData.globalSetting.secret_tips : '请联系客服，在支付2-3元后，客服人员会发送给你一个串阅读秘钥用来解锁整本书。'
    self.setData({ bookid: bookid, startReadTime: new Date(), secretTips: secretTips })
    // 初始化页面
    self.initPage()
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
  },
  // 分享逻辑
  onShareAppMessage: function(res) {
    let self = this
    // 获取分享出去的图片地址
    const shareParams = app.globalData.globalData.share
    const now = new Date()
    const code = app.globalData.shareCode + '_' + now.getTime()
    if (shareParams && app.globalData.shareCode) {
      return {
        title: shareParams.title,
        path: shareParams.page + '?code' + code,
        imageUrl: shareParams.imageUrl
      }
    } else {
      self.showToast('获取分享参数失败', 'bottom')
      return false
    }
  },
  handletouchmove: function(event) {
    // console.log('正在执行touchmove, isMoving为：'+isMoving);
    var self = this
    if (currentGesture != 0 || isMoving == 1) {
      return
    }
    var currentX = event.touches[0].pageX
    var currentY = event.touches[0].pageY
    // 判断用没有滑动而是点击屏幕的动作
    hasRunTouchMove = true
    // console.log('正在执行touchmove, isMoving为：'+isMoving+'------event: {x: '+event.touches[0].pageX+' ,y: '+event.touches[0].pageY+'}');
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
    // console.log('正在执行touchtart, isMoving为：'+isMoving+'------event: {x: '+event.touches[0].pageX+' ,y: '+event.touches[0].pageY+'}');
    if (isMoving == 0) {
      this.setData({ touches: { lastX: event.touches[0].pageX, lastY: event.touches[0].pageY } })
    }
  },
  handleDownClick: function(event) {
    this.setData({
      control: {
        all: this.data.control.all === 0 ? 1 : 0,
        control_tab: 1,
        control_detail: 1,
        target: this.data.control.target || 'jingdu'
      },
      isShowFontSelector: 0
    })
  },
  handletouchend: function() {
    // console.log('正在执行touchend, isMoving为：'+isMoving);
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
            target: self.data.control.target || 'jingdu'
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
          // pingjunValue = Math.abs(targetLeftValue - self.data.leftValue) / 4 //500ms其实函数只执行了4次，第一次会等待100ms才会开始函数
          // isMoving = 1 //开始计时的时候将标志置1
          //使用计时器实现动画效果
          // leftMoveTimer = setInterval(function() {
          //   ++leftTimmerCount
          //   var currentLeftValue = self.data.leftValue
          //   //如果达到了目标值，立即停止计时器
          //   //调试发现有些时候这个if的跳转会莫名的不成立，所以做个限制，函数被执行了4次之后，无论条件是否成立，将leftValue设置为目标值，并结束计时器
          //   if (leftTimmerCount == 4) {
          //     clearInterval(leftMoveTimer)
          //     isMoving = 0
          //     leftTimmerCount = 0
          //     self.setData({ leftValue: targetLeftValue })
          //     return
          //   }
          //   if (currentLeftValue == targetLeftValue) {
          //     clearInterval(leftMoveTimer)
          //     isMoving = 0
          //     leftTimmerCount = 0
          //     self.setData({ leftValue: targetLeftValue })
          //     return
          //   }
          //   self.setData({ leftValue: currentLeftValue - pingjunValue })
          // }, 75)
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
          // pingjunValue = Math.abs(targetLeftValue - self.data.leftValue) / 4
          // isMoving = 1
          // rightMoveTimer = setInterval(function() {
          //   ++rightTimmerCount
          //   var currentLeftValue = self.data.leftValue
          //   if (rightTimmerCount == 4) {
          //     clearInterval(rightMoveTimer)
          //     isMoving = 0
          //     rightTimmerCount = 0
          //     self.setData({ leftValue: targetLeftValue })
          //     return
          //   }
          //   if (currentLeftValue == targetLeftValue) {
          //     clearInterval(rightMoveTimer)
          //     isMoving = 0
          //     rightTimmerCount = 0
          //     self.setData({ leftValue: targetLeftValue })
          //     return
          //   }
          //   self.setData({ leftValue: currentLeftValue + pingjunValue })
          // }, 75)
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
            content: res.data.data.content.replace(/[\r\n]+\s*/g, '\n '),
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
          } else if (!res.data.canRead && res.data.autoBuy) {
            // self.setData({
            //   'modal': {
            //     show: true,
            //     name: 'buyfail',
            //     inputValue: '',
            //     title: '温馨提示',
            //     opacity: 0.6,
            //     position: 'center',
            //     width: '80%',
            //     options: {
            //       fullscreen: false,
            //       showclose: true,
            //       showfooter: false,
            //       closeonclickmodal: true,
            //       confirmText: '',
            //     }
            //   }
            // })
          }
          wx.setNavigationBarTitle({
            title: '第' + res.data.data.num + '章 ' + res.data.data.name
          })
          // 如果为上下翻页，则不需要重新计算最大分页数
          if (self.data.overPage === 1) {
            return false
          }
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
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
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
        button_font_color: '#0770cb'
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
        button_font_color: '#866842'
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
        button_font_color: '#3a732c'
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
        button_font_color: '#2c5a7e'
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
        button_font_color: '#0770cb'
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
            button_font_color: '#0770cb'
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
            button_font_color: '#866842'
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
            button_font_color: '#3a732c'
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
            button_font_color: '#2c5a7e'
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
    wx.request({
      url: config.base_url + '/api/chapter/list?bookid=' + self.data.bookid,
      success: res => {
        if (res.data.ok) {
          self.setData({
            allSectionData: res.data.data.chapters,
            isShowMulu: 1,
            control: {
              all: 0,
              control_tab: 0,
              control_detail: 0,
              target: self.data.control.target || 'jingdu'
            }
          })
        } else {
          self.showToast('获取目录失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取目录失败', 'bottom')
      }
    })
  },
  //点击目录某一章
  showThisSection: function(event) {
    var self = this
    var chapterid = event.currentTarget.dataset.chapterid
    self.setData({ isShowMulu: 0, loading: true })
    //根据章节id去得到章节内容
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/chapter/detail?bookid=' + self.data.bookid + '&chapter_id=' + chapterid,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success(res) {
        if (res.data.ok) {
          self.setData({
            currentSectionNum: res.data.data.num,
            content: res.data.data.content.replace(/[\r\n]+\s*/g, '\n '),
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
          } else if (!res.data.canRead && res.data.autoBuy) {
            // self.setData({
            //   'modal': {
            //     show: true,
            //     name: 'buyfail',
            //     inputValue: '',
            //     title: '温馨提示',
            //     inputValue: '',
            //     opacity: 0.6,
            //     position: 'center',
            //     width: '80%',
            //     options: {
            //       fullscreen: false,
            //       showclose: true,
            //       showfooter: false,
            //       closeonclickmodal: true,
            //       confirmText: '',
            //     }
            //   }
            // })
          }
          wx.setNavigationBarTitle({
            title: '第' + res.data.data.num + '章 ' + res.data.data.name
          })
          // 如果为上下翻页，则不需要重新计算最大分页数
          if (self.data.overPage === 1) {
            return false
          }
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
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
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
            content: res.data.data.content.replace(/[\r\n]+\s*/g, '\n '),
            author: res.data.author,
            headImg: res.data.headimg,
            isShowBuy: !res.data.canRead,
            hasGotMaxNum: false
          })
          if (res.data.canRead && res.data.doAutoBuy) {
            self.showToast('已为您自动给购买该章节', 'bottom')
          } else if (!res.data.canRead && res.data.autoBuy) {
            // self.setData({
            //   'modal': {
            //     show: true,
            //     name: 'buyfail',
            //     inputValue: '',
            //     title: '温馨提示',
            //     inputValue: '',
            //     opacity: 0.6,
            //     position: 'center',
            //     width: '80%',
            //     options: {
            //       fullscreen: false,
            //       showclose: true,
            //       showfooter: false,
            //       closeonclickmodal: true,
            //       confirmText: '',
            //     }
            //   }
            // })
          }
          // 设置标题
          wx.setNavigationBarTitle({
            title: '第' + res.data.data.num + '章 ' + res.data.data.name
          })
          // 如果为上下翻页，则不需要重新计算最大分页数
          if (app.globalData.userInfo.setting && app.globalData.userInfo.setting.reader.overPage === 1) {
            wx.getSystemInfo({
              success: function(response) {
                self.setData({
                  leftValue: res.data.scroll > 0 ? res.data.scroll : 0,
                  windows: {
                    windows_height: response.windowHeight,
                    windows_width: response.windowWidth
                  },
                  loading: false
                })
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
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
          self.setData({ loading: false, loadFail: true })
        } else {
          self.setData({ loading: false, loadFail: true })
          self.showToast('获取章节内容失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
          // 展示无数据按钮
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
    const bookid = self.data.bookid
    const factionName = self.data.factionName
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/booklist/update_read',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        bookid: self.data.bookid,
        chapter_num: self.data.currentSectionNum,
        chapter_page_index: self.data.pageIndex,
        chapter_page_top: self.data.leftValue,
        read_time: self.data.startReadTime ? new Date().getTime() - self.data.startReadTime.getTime() : 0,
        setting: setting
      },
      success: res => {
        if (res.data.ok) {
          // 判断改书籍是否在书籍列表中，没有在的话提示用户加入加入
          // const allbooks = wx.getStorageSync('allbooks')
          // if (allbooks.indexOf(bookid) < 0) {
          //   wx.showModal({
          //     title: '温馨提示',
          //     content: '是否将《' + factionName + '》加入书架？',
          //     success: res => {
          //       if (res.confirm) {
          //         wx.request({
          //           url: config.base_url + '/api/booklist/add_book?id=' + bookid,
          //           header: {
          //             Authorization: 'Bearer ' + app.globalData.token
          //           },
          //           success: res => {
          //             if (res.data.ok) {
          //               wx.showToast({ title: '加入书架成功', icon: 'success' })
          //             } else if (res.data.authfail) {
          //               wx.navigateTo({
          //                 url: '../loading/loading?need_login_again=1'
          //               })
          //             } else {
          //               wx.showToast({ title: '加入书架失败，请重新尝试~', icon: 'error' })
          //             }
          //           },
          //           fail: err => {
          //             wx.showToast({ title: '加入书架失败，请重新尝试~', icon: 'error' })
          //           }
          //         })
          //       }
          //     }
          //   })
          // }
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('更新阅读进度失败', 'bottom')
        }
      }
    })
  },
  closeReaderTips: function() {
    var self = this
    self.setData({ showReaderTips: false })
    wx.setStorageSync('show_reader_tips', false)
  },
  searchChapter: function(event) {
    var self = this
    wx.request({
      url: config.base_url + '/api/chapter/search?bookid=' + self.data.bookid + '&str=' + event.detail.value,
      success: res => {
        if (res.data.ok) {
          self.setData({ allSectionData: res.data.data.chapters })
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
    var self = this
    var x = event.detail.x
    var w = self.data.windows.windows_width * 0.92
    if (x > w) {
      // 显示控制栏
      self.setData({
        control: {
          all: 0,
          control_tab: 0,
          control_detail: 0,
          target: self.data.control.target || 'jingdu'
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
          content: res.data.data.content.replace(/[\r\n]+\s*/g, '\n '),
          factionTitle: res.data.data.name,
          'allSliderValue.section': res.data.data.num,
          hasGotMaxNum: false,
          isShowBuy: !res.data.canRead
        })
        if (res.data.canRead && res.data.doAutoBuy) {
          self.showToast('已为您自动给购买该章节', 'bottom')
        } else if (!res.data.canRead && res.data.autoBuy) {
          // self.setData({
          //   'modal': {
          //     show: true,
          //     name: 'buyfail',
          //     inputValue: '',
          //     title: '温馨提示',
          //     opacity: 0.6,
          //     position: 'center',
          //     width: '80%',
          //     options: {
          //       fullscreen: false,
          //       showclose: true,
          //       showfooter: false,
          //       closeonclickmodal: true,
          //       confirmText: '',
          //     }
          //   }
          // })
        }
        // 设置标题
        wx.setNavigationBarTitle({
          title: '第' + res.data.data.num + '章 ' + res.data.data.name
        })
        // 如果为上下翻页，则不需要重新计算最大分页数
        if (self.data.overPage === 1) {
          return false
        }
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
      } else if (res.data.authfail) {
        wx.navigateTo({
          url: '../loading/loading?need_login_again=1'
        })
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
    let preChapterNum = self.data.currentSectionNum - 1
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
        fail(e) {
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
    let preChapterNum = self.data.currentSectionNum - 1
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
          content: res.data.data.content.replace(/[\r\n]+\s*/g, '\n '),
          factionTitle: res.data.data.name,
          'allSliderValue.section': res.data.data.num,
          hasGotMaxNum: false,
          pageIndex: 1, // 将pageIndex重置为第一页
          useTransition: false,
          leftValue: 0, // 左滑值重置为0
          isShowBuy: !res.data.canRead
        })
        if (res.data.canRead && res.data.doAutoBuy) {
          self.showToast('已为您自动给购买该章节', 'bottom')
        } else if (!res.data.canRead && res.data.autoBuy) {
          // self.setData({
          //   'modal': {
          //     show: true,
          //     name: 'buyfail',
          //     inputValue: '',
          //     title: '温馨提示',
          //     opacity: 0.6,
          //     position: 'center',
          //     width: '80%',
          //     options: {
          //       fullscreen: false,
          //       showclose: true,
          //       showfooter: false,
          //       closeonclickmodal: true,
          //       confirmText: '',
          //     }
          //   }
          // })
        }
        // 设置标题
        wx.setNavigationBarTitle({
          title: '第' + res.data.data.num + '章 ' + res.data.data.name
        })
        // 如果为上下翻页，则不需要重新计算最大分页数
        if (self.data.overPage === 1) {
          return false
        }
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
      } else if (res.data.authfail) {
        wx.navigateTo({
          url: '../loading/loading?need_login_again=1'
        })
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
      callback(self.data.afterData)
      self.setData({ afterLoaded: false, afterData: '' })
      return
    }
    let nextChapterNum = self.data.currentSectionNum + 1
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
        fail(e) {
          self.setData({ loading: false, loadFail: true })
          self.showToast('加载下一章失败', 'bottom')
        }
      })
    } else {
      self.showToast('已经翻到最后面了', 'bottom')
    }
  },
  // 预加载下一章
  loadAfter: function() {
    let self = this
    let nextChapterNum = self.data.currentSectionNum + 1
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
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
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
        name: 'secret',
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
  },
  hasSecret: function() {
    this.setData({
      'modal.title': '请输入秘钥',
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
      self.showToast('请输入秘钥', 'bottom')
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
          wx.showToast({ title: '解锁成功', icon: 'success' })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
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
  handleScroll: function(event) {
    this.setData({ leftValue: event.detail.scrollTop })
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
