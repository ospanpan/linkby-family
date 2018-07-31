Page({
  data: {
    hidePullDown: true,
    hidePullUp: true,
    hideNoMore: true,  
    curPage_notice: 0,  //通知列表当前页码
    totalPage_notice: 0, 
    noticeList: [],     //通知列表

    familyInfo: { student: "", appellation: "" },  //当前家长信息
    userInfo: null     //用户信息
  },
  onLoad: function () {
    var app = getApp();
    if (app.globalData.userInfo.family != null) {
      this.setData({ familyInfo: app.globalData.userInfo.family });
    }
    if (app.globalData.userInfo.user != null) {
      this.setData({ userInfo: app.globalData.userInfo.user });
    }
    if (this.data.userInfo != null && this.data.familyInfo.id != null) {
      this.reloadInfo();
    }
    wx.login({
      //获取code
      success: function (res) {
        var code = res.code;
        wx.request({
          url: 'https://api.weixin.qq.com/sns/jscode2session?appid=' + app.AppID + '&secret=' + app.Secret + '&js_code=' + code + '&grant_type=authorization_code',
          data: {},
          header: {
            'content-type': 'application/json'
          },
          success: function (res) {
            var openid = res.data.openid //返回openid
            app.post_api_data(app.globalData.api_URL.UpdateUserInfo,
              {
                'id': app.globalData.userInfo.user.id,
                'uuId': openid
              },
              function (data) { }, function (err) { });
          }
        })
      }
    })
  },

  refreshNotice: function () {
    var curModule = this;
    curModule.setData({ hideNoMore: true });
    curModule.setData({ hidePullDown: false });
    curModule.setData({ curPage_notice: 0 });
    curModule.getNoticeList(function () {
      curModule.setData({ hidePullDown: true });
      if (curModule.data.totalPage_notice > curModule.data.curPage_notice) {
        curModule.setData({ hideNoMore: true });
      } else {
        curModule.setData({ hideNoMore: false });
      }
    });
  },

  loadMoreNotice: function () {
    var curModule = this;
    curModule.setData({ hideNoMore: true });
    curModule.setData({ hidePullUp: false });
    setTimeout(function () {
      if (curModule.data.totalPage_notice > curModule.data.curPage_notice) {
        curModule.getNoticeList(function () {
          curModule.setData({ hidePullUp: true });
          if (curModule.data.totalPage_notice > curModule.data.curPage_notice) {
            curModule.setData({ hideNoMore: true });
          } else {
            curModule.setData({ hideNoMore: false });
          }
        });
      }else{
        curModule.setData({ hidePullUp: true });
        curModule.setData({ hideNoMore: false });
      }
    }, 300);
  },

  reloadInfo: function () {
    var curModule = this;
    var app = getApp();
    this.setData({ familyInfo: app.globalData.userInfo.family });
    this.setData({ userInfo: app.globalData.userInfo.user });
    this.getNoticeList();//获取通知列表
  },
  toShowNotice: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/parent/notice/notice?noticeId=' + id });
    var formId = e.detail.formId;

    var app = getApp();
    console.log("formId=" + formId + ", userId=" + app.globalData.userInfo.user.id);
    app.post_api_data(app.globalData.api_URL.AddSaveForm, {
      'userId': app.globalData.userInfo.user.id,
      'formId': formId
    }, function (data) {
      console.log(JSON.stringify(data));
    }, function () { });
  },
  //获取通知列表
  getNoticeList: function (sucFun) {
    var curModule = this;
    var app = getApp();
    app.get_api_data(app.globalData.api_URL.GetClassNoticeList,
      {
        'classesId': app.globalData.userInfo.family.classesId,
        'schoolId': app.globalData.userInfo.family.schoolId,
        'familyId': app.globalData.userInfo.family.id,
        'pageSize': 10,
        'page': (curModule.data.curPage_notice + 1)
      },
      function (data) {
        if (data.apiStatus == "200") {
          for (var i = 0; i < data.data.dataList.length; i++) {
            var createDate = new Date(data.data.dataList[i].notice.createDate);
            var month = createDate.getMonth() + 1;
            var strDate = createDate.getDate();
            var hour = createDate.getHours();
            hour = hour < 10 ? ('0' + hour) : hour;
            var minute = createDate.getMinutes();
            minute = minute < 10 ? ('0' + minute) : minute;
            data.data.dataList[i].notice.date = month + "-" + strDate + "  周" + "日一二三四五六".charAt(createDate.getDay());
            data.data.dataList[i].notice.time = hour + ":" + minute;
          }
          curModule.setData({ curPage_notice: data.data.curPage });
          curModule.setData({ totalPage_notice: data.data.pageCount });
          curModule.setData({ noticeList: curModule.data.noticeList.concat(data.data.dataList) });
          if(typeof(sucFun)=="function"){
            sucFun();
          }
        }
      }, function () {
        wx.showToast({ title: "获取失败" });
      });
  },
  imgYu: function (event) {
    var src = event.currentTarget.dataset.src;//获取data-src
    var id = event.currentTarget.dataset.id;
    var imgArr = [];
    for (var i = 0; i < this.data.dynamicsList.length; i++) {
      if (this.data.dynamicsList[i].dynamics.id == id) {
        imgArr = this.data.dynamicsList[i].dynamics.imgArr;
        break;
      }
    }
    //图片预览  本地图片不能预览
    wx.previewImage({
      current: src, // 当前显示图片的http链接
      urls: imgArr // 需要预览的图片http链接列表
    });
  },

  //显示刚刚时间类
  getDateDiff: function (dateStr) {
    var publishTime = this.getDateTimeStamp(dateStr) / 1000,
      d_seconds,
      d_minutes,
      d_hours,
      d_days,
      timeNow = parseInt(new Date().getTime() / 1000),
      d,

      date = new Date(publishTime * 1000),
      Y = date.getFullYear(),
      M = date.getMonth() + 1,
      D = date.getDate(),
      H = date.getHours(),
      m = date.getMinutes(),
      s = date.getSeconds();
    //小于10的在前面补0
    if (M < 10) {
      M = '0' + M;
    }
    if (D < 10) {
      D = '0' + D;
    }
    if (H < 10) {
      H = '0' + H;
    }
    if (m < 10) {
      m = '0' + m;
    }
    if (s < 10) {
      s = '0' + s;
    }

    d = timeNow - publishTime;
    d_days = parseInt(d / 86400);
    d_hours = parseInt(d / 3600);
    d_minutes = parseInt(d / 60);
    d_seconds = parseInt(d);

    if (d_days > 0 && d_days < 3) {
      return d_days + '天前';
    } else if (d_days <= 0 && d_hours > 0) {
      return d_hours + '小时前';
    } else if (d_hours <= 0 && d_minutes > 0) {
      return d_minutes + '分钟前';
    } else if (d_seconds < 60) {
      if (d_seconds <= 0) {
        return '刚刚';
      } else {
        return d_seconds + '秒前';
      }
    } else if (d_days >= 3 && d_days < 30) {
      return M + '-' + D + ' ' + H + ':' + m;
    } else if (d_days >= 30) {
      return Y + '-' + M + '-' + D + ' ' + H + ':' + m;
    }
  },
  getDateTimeStamp: function (dateStr) {
    return Date.parse(dateStr.replace(/-/gi, "/"));
  }

})