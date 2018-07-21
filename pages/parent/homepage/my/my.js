Page({
  data: {
    familyInfo: { student: "", appellation: "" },  //当前家长信息
    userInfo: null,     //用户信息
    allClasses: [],      //当前家长所有班级信息

    interactionCount: 0, //班级圈互动数量
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

  onPullDownRefresh: function () {

  },

  onReachBottom: function () {

  },

  reloadInfo: function () {
    var curModule = this;
    var app = getApp();
    this.setData({ familyInfo: app.globalData.userInfo.family });
    this.setData({ userInfo: app.globalData.userInfo.user });

    this.getAllClasses(); //获取所有班级
    this.getInteractionCount(); //获取班级圈互动数量
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
  },

  //获取所有班级信息
  getAllClasses: function () {
    var curModule = this;
    var app = getApp();
    app.get_api_data(app.globalData.api_URL.GetAllClasses_Family,
      {
        'userId': app.globalData.userInfo.user.id
      },
      function (data) {
        if (data.apiStatus == "200") {
          var currentClasses = null;
          var otherClassesArr = [];
          var newClassesArr = [];
          for (var i = 0; i < data.data.length; i++) {
            if (app.globalData.userInfo.user.curClassesId == data.data[i].classes.id) {
              currentClasses = data.data[i];
            } else {
              otherClassesArr.push(data.data[i]);
            }
          }
          if (currentClasses != null && currentClasses.classes != null && currentClasses.classes.id != null && currentClasses.classes.id.length > 0) {
            newClassesArr.push(currentClasses);
          }
          curModule.setData({ allClasses: newClassesArr.concat(otherClassesArr) });
        }
      }, function () {
        wx.showToast({ title: "获取失败" });
      });
  },

  //切换班级
  toChangeClasses: function (event) {
    var curModule = this;
    var classId = event.currentTarget.dataset.classid;
    var app = getApp();
    wx.showLoading({ title: '正在切换', mask: true });
    app.post_api_data(app.globalData.api_URL.FamilyTransferClasses,
      {
        curClassesId: classId,
        id: app.globalData.userInfo.user.id
      },
      function (data) {
        if (data.apiStatus == "200") {
          app.globalData.userInfo.user.curClassesId = classId;
          curModule.getCurrentFamilyUserInfo(classId, function () {
            curModule.reloadInfo();
            wx.showToast({ title: '切换完成', icon: "success" });
          });
        }
        setTimeout(function () {
          wx.hideLoading();
        }, 150);
      }, function (err) {
        wx.showToast({ title: '操作失败' });
        setTimeout(function () {
          wx.hideLoading();
        }, 150);
      });
  },
  //获取当前家长信息
  getCurrentFamilyUserInfo: function (classesId, sucFun) {
    var curModule = this;
    var app = getApp();
    app.get_api_data(app.globalData.api_URL.GetCurrentFamilyUserInfo,
      {
        'userId': app.globalData.userInfo.user.id,
        'classesId': classesId
      },
      function (data) {
        if (data.apiStatus == "200") {
          app.globalData.userInfo = data.data;
          if (typeof (sucFun) == "function") {
            sucFun();
          }
        }
      }, function () {
        wx.showToast({ title: "获取失败" });
      });
  },
  //获取班级圈互动数量
  getInteractionCount: function () {
    var curModule = this;
    var app = getApp();
    app.get_api_data(app.globalData.api_URL.GetInteractionCount,
      {
        'userId': app.globalData.userInfo.user.id,
        'classesId': app.globalData.userInfo.user.curClassesId,
        'schoolId': app.globalData.userInfo.family.schoolId
      },
      function (data) {
        if (data.apiStatus == "200") {
          curModule.setData({ interactionCount: data.data });
        }
      }, function () {
        wx.showToast({ title: "获取失败" });
      });
  },

  //退出
  toLogout: function () {
    wx.showLoading({ title: '正在退出', mask: true });
    var app = getApp();
    app.globalData.userInfo = null;
    wx.redirectTo({ url: '/pages/parent/login/login' });
    setTimeout(function () {
      wx.hideLoading();
    }, 150);
  }

})