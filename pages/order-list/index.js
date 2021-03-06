var wxpay = require('../../utils/pay.js')
const api = require('../../utils/request.js')
const md5 = require('../../utils/MD5.js')
var app = getApp()
Page({
  data: {
    statusType: ["待付款", "待发货", "待收货", "待评价", "已完成"],
    currentType: 0,
    tabClass: ["", "", "", "", ""]
  },
  statusTap: function(e) {
    var curType = e.currentTarget.dataset.index;
    this.data.currentType = curType
    this.setData({
      currentType: curType
    });
    this.onShow();
  },
  orderDetail: function(e) {
    var orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: "/pages/order-details/index?id=" + orderId
    })
  },
  cancelOrderTap: function(e) {
    var that = this;
    var orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确定要取消该订单吗？',
      content: '',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading();
          api.fetchRequest('/order/close', {
            token: wx.getStorageSync('token'),
            orderId: orderId
          }).then(function(res) {
            if (res.data.code == 0) {
              that.onShow();
            }
          }).finally(function(res) {
            wx.hideLoading();
          })
        }
      }
    })
  },
  toPayTap: function(e) {
    // var that = this;
    // var orderId = e.currentTarget.dataset.id;
    // var money = e.currentTarget.dataset.money;
    // var needScore = e.currentTarget.dataset.score;
    // api.fetchRequest('/user/amount', {
    //   token: wx.getStorageSync('token'),
    // }).then(function(res) {
    //   if (res.data.code == 0) {
    //     // res.data.data.balance
    //     money = money - res.data.data.balance;
    //     if (res.data.data.score < needScore) {
    //       wx.showModal({
    //         title: '错误',
    //         content: '您的积分不足，无法支付',
    //         showCancel: false
    //       })
    //       return;
    //     }
    //     if (money <= 0) {
    //       // 直接使用余额支付
    //       api.fetchRequest('/order/pay', {
    //         token: wx.getStorageSync('token'),
    //         orderId: orderId
    //       }, 'POST', 0, {
    //         'content-type': 'application/x-www-form-urlencoded'
    //       }).then(function(res) {
    //         that.onShow();
    //       })
    //     } else {
    //       wxpay.wxpay(app, money, orderId, "/pages/order-list/index");
    //     }
    //   } else {
    //     wx.showModal({
    //       title: '错误',
    //       content: '无法获取用户资金信息',
    //       showCancel: false
    //     })
    //   }
    // })
    var customer_id = '';
    var order_name = e.currentTarget.dataset.id;
    var m_number = 101455;
    var timestamp = Date.now();
    var secret_key = '3c15fc75be174de783515a3e2365ed50';
    function getNoncestr(length = 32) {
      let chars = 'qwertyuiopasdfghjklzxcvbnm1234567890';
      let str = '';
      let i = 0;
      for (i = 0; i < length; i ++) {
        str += chars.substr(Math.floor(Math.random() * chars.length), 1);
      }
      return str;
    };
    let nonce_str = getNoncestr();
    console.log(nonce_str);
    var code = m_number + '&' + timestamp + '&' + nonce_str + '&' + secret_key;
    var sign = md5.hexMD5(code);
    var amount = e.currentTarget.dataset.money * 100;
    var order_name = 'aaa';
    var out_order_no = '';
    var platform = 'WECHATPAY';
    var currency = 'CNY';
    api.fetchRequest('/user/wxinfo', {
      token: wx.getStorageSync('token'),
    }).then(function (res) {
      if (res.data.code == 0) {
        customer_id = res.data.data.openid;
        out_order_no = customer_id + timestamp;
        console.log(out_order_no);
        var url = 'https://www.omipay.com.cn/omipay/api/v2/MakeAppletOrder?m_number=' + m_number + '&timestamp=' + timestamp + '&nonce_str=' + nonce_str + '&sign=' + sign + '&currency=' + currency + '&amount=' + amount + '&order_name=' + order_name + '&out_order_no=' + out_order_no + '&platform=' + platform + '&app_id=' + api.appid + '&customer_id=' + customer_id;
        wx.request({
          url: url,
          method: 'POST',
          header: {
            "Content-Type": "application/json"
          },
          success: function (res) {
            console.log(res);
            wx.requestPayment({
              timeStamp: res.data.timeStamp,
              nonceStr: res.data.nonceStr,
              package: res.data.package,
              signType: 'MD5',
              paySign: res.data.paySign,
              success: function(res) {
                console.log('success pay request' + res);
              },
              fail: function(res) {
                console.info(res);
              },
              complete: function() {
                console.info('call back');
              }
            })
          }
        });
      }
    });
  },
  onLoad: function(options) {
    // 生命周期函数--监听页面加载

  },
  onReady: function() {
    // 生命周期函数--监听页面初次渲染完成

  },
  getOrderStatistics: function() {
    var that = this;
    api.fetchRequest('/order/statistics', {
      token: wx.getStorageSync('token')
    }).then(function(res) {
      if (res.data.code == 0) {
        var tabClass = that.data.tabClass;
        if (res.data.data.count_id_no_pay > 0) {
          tabClass[0] = "red-dot"
        } else {
          tabClass[0] = ""
        }
        if (res.data.data.count_id_no_transfer > 0) {
          tabClass[1] = "red-dot"
        } else {
          tabClass[1] = ""
        }
        if (res.data.data.count_id_no_confirm > 0) {
          tabClass[2] = "red-dot"
        } else {
          tabClass[2] = ""
        }
        if (res.data.data.count_id_no_reputation > 0) {
          tabClass[3] = "red-dot"
        } else {
          tabClass[3] = ""
        }
        if (res.data.data.count_id_success > 0) {
          //tabClass[4] = "red-dot"
        } else {
          //tabClass[4] = ""
        }

        that.setData({
          tabClass: tabClass,
        });
      }
    }).finally(function(res) {
      wx.hideLoading();
    })
  },
  onShow: function() {
    // 获取订单列表
    wx.showLoading();
    var that = this;
    var postData = {
      token: wx.getStorageSync('token')
    };
    postData.status = that.data.currentType;
    this.getOrderStatistics();
    api.fetchRequest('/order/list', postData).then(function(res) {
      if (res.data.code == 0) {
        that.setData({
          orderList: res.data.data.orderList,
          logisticsMap: res.data.data.logisticsMap,
          goodsMap: res.data.data.goodsMap
        });
      } else {
        that.setData({
          orderList: null,
          logisticsMap: {},
          goodsMap: {}
        });
      }
    }).finally(function(res) {
      wx.hideLoading();
    })
  },
  onHide: function() {
    // 生命周期函数--监听页面隐藏

  },
  onUnload: function() {
    // 生命周期函数--监听页面卸载

  },
  onPullDownRefresh: function() {
    // 页面相关事件处理函数--监听用户下拉动作

  },
  onReachBottom: function() {
    // 页面上拉触底事件的处理函数

  }
})