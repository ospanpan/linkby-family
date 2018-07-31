Page({
  data: {
    hidePullDown: true,
    hidePullUp: true,
    hideNoMore: true,
    homeworkList: [],     //作业列表数据
    curPage_homework: 0,  //作业列表当前页码
    totalPage_homework: 0,

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

  loadMoreHomework: function () {
    var curModule = this;
    curModule.setData({ hideNoMore: true });
    curModule.setData({ hidePullUp: false });
    setTimeout(function () {
      if (curModule.data.totalPage_homework > curModule.data.curPage_homework) {
        curModule.getHomeworkList(function () {
          curModule.setData({ hidePullUp: true });
          if (curModule.data.totalPage_homework > curModule.data.curPage_homework) {
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

  refreshHomework: function () {
    var curModule = this;
    curModule.setData({ hideNoMore: true });
    curModule.setData({ hidePullDown: false });
    curModule.setData({ curPage_homework: 0 });
    curModule.getHomeworkList(function () {
      curModule.setData({ hidePullDown: true });
      if (curModule.data.totalPage_homework > curModule.data.curPage_homework) {
        curModule.setData({ hideNoMore: true });
      } else {
        curModule.setData({ hideNoMore: false });
      }
    });
  },

  reloadInfo: function () {
    var curModule = this;
    var app = getApp();
    this.setData({ familyInfo: app.globalData.userInfo.family });
    this.setData({ userInfo: app.globalData.userInfo.user });
    
    this.getHomeworkList();//获取作业分页列表
  },  
  toShowTask: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/parent/task/content/content?homeworkId=' + id });
  },
  //获取作业分页列表
  getHomeworkList: function (sucFun) {
    var curModule = this;
    var app = getApp();
    app.get_api_data(app.globalData.api_URL.GetHomeworkList,
      {
        'classesId': app.globalData.userInfo.family.classesId,
        'schoolId': app.globalData.userInfo.family.schoolId,
        'pageSize': 10,
        'page': (curModule.data.curPage_homework + 1)
      },
      function (data) {
        if (data.apiStatus == "200") {
          curModule.setData({ curPage_homework: data.data.curPage });
          curModule.setData({ totalPage_homework: data.data.pageCount });
          curModule.setData({ homeworkList: curModule.data.homeworkList.concat(data.data.dataList) });
        }
        if (typeof (sucFun)=="function"){
          sucFun();
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