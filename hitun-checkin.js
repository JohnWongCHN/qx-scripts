/*
 * @Author: John Wong
 * @Date: 2022-01-20 11:35:20
 * @LastEditors: John Wong
 * @LastEditTime: 2022-01-21 19:05:03
 * @FilePath: /qx-scripts/hitun-checkin.js
 * @Desc: hitun.io auto check in
 * @Version: v0.1
 */

const msg = {};
const hitun = init();

!(async function main() {
  const KEY = hitun.getdata("CookieHitun");
  if (hitun.isRequest) {
    GetCookie(); // 获取用户Cookie
  } else if (KEY) {
    await Checkin(KEY); // 用户签到获取流量
  } else {
    hitun.notify("海豚湾🐬", "签到失败", "未获取Cookie 🚫");
  }
})()
  .catch((e) => {
    hitun.notify("海豚🐬签到", "", e.message || JSON.stringify(e));
  })
  .finally(() => {
    hitun.time();
    hitun.notify("海豚湾🐬签到", "", msg.msg);
    hitun.done();
  });

// init
function init() {
  //
  const start = Date.now();
  const time = () => {
    const end = ((Date.now() - start) / 1000).toFixed(2);
    return console.log("\n签到用时: " + end + " 秒");
  };
  const isRequest = typeof $request != "undefined";
  const isQuanX = typeof $task != "undefined";
  const getdata = (key) => {
    if (isQuanX) return $prefs.valueForKey(key);
  };
  const setdata = (key, val) => {
    if (isQuanX) return $prefs.setValueForKey(key, val);
  };
  const notify = (title, subtitle, body) => {
    if (isQuanX) $notify(title, subtitle, body);
  };
  const adapterStatus = (response) => {
    if (response) {
      if (response.status) {
        response["statusCode"] = response.status;
      } else if (response.statusCode) {
        response["status"] = response.statusCode;
      }
    }
    return response;
  };
  const get = (options, callback) => {
    if (isQuanX) {
      options.method = "GET";
      $task.fetch(options).then(
        (response) => {
          callback(null, adapterStatus(response), response.body);
        },
        (reason) => callback(reason.error, null, null)
      );
    }
  };
  const post = (options, callback) => {
    if (isQuanX) {
      options.method = "POST";
      $task.fetch(options).then(
        (response) => {
          callback(null, adapterStatus(response), response.body);
        },
        (reason) => callback(reason.error, null, null)
      );
    }
  };
  const done = (value = {}) => {
    $done(value);
  };
  return {
    start,
    isRequest,
    isQuanX,
    time,
    notify,
    getdata,
    setdata,
    get,
    post,
    done,
  };
}

// get hitun.io cookie
function GetCookie() {
  const req = $request;
  if (req.headers) {
    const CV = req.headers["Cookie"] || req.headers["cookie"] || "";
    if (/^https:\/\/hitun.io\/user/.test(req.url)) {
      if (CV) {
        const value = UpdateCookie(null, CV);
        if (value.type !== -1) {
          const write = hitun.setdata(
            JSON.stringify(value.cookie),
            "CookieHitun"
          );
          hitun.notify(
            `Email: ${value.email}`,
            ``,
            `更新 海豚湾🐬 [账号${value.email}] Cookie ${
              write ? `成功 🎉` : `失败 🚫`
            }`
          );
        } else {
          console.log(
            `\n用户名: ${value.email}\n与历史 海豚湾🐬 [账号${value.email}] Cookie相同, 跳过写入 🚫`
          );
        }
      } else {
        throw new Error("写入Cookie失败, 关键值缺失\n可能原因: 非网页获取 ‼️");
      }
    } else if (req.url === "http://www.apple.com/") {
      throw new Error("类型错误, 手动运行请选择上下文环境为Cron 🚫");
    }
  } else if (!req.headers) {
    throw new Error("写入Cookie失败, 请检查匹配URL或配置内脚本类型 ⚠️");
  }
}

// update stored cookie
function UpdateCookie(oldValue, newValue) {
  let type, email, cookie;
  let ip = (oldValue || newValue || "").split(/ip=(.+?);/)[1];
  let storedCookie = hitun.getdata("CookieHitun");
  if (storedCookie && ip === storedCookie.split(/ip=(.+?);/)[1]) {
    type = -1;
    email = storedCookie.split(/email=(.+?);/)[1];
    cookie = storedCookie;
  } else {
    type = 1;
    cookie = newValue;
    email = (oldValue || newValue || "").split(/email=(.+?);/)[1];
  }
  return {
    cookie: cookie,
    type: type, // -1: same, 1: update
    email: decodeURIComponent(email),
  };
}

function Checkin(cookie) {
  // run task
  return new Promise((resolve) => {
    setTimeout(() => {
      const HitunURL = {
        url: "https://hitun.io/user/checkin",
        headers: {
          Cookie: cookie,
          Accept: "*/*",
          "Accept-Encoding": "gzip,deflate,br",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
          Connection: "keep-alive",
        },
      };
      hitun.post(HitunURL, function (error, response, data) {
        try {
          if (error) {
            throw new Error(error);
          } else {
            const ret = JSON.parse(data);
            msg.msg = ret.msg;
            console.log(ret.msg);
          }
        } catch (error) {
          console.log("\n海豚湾🐬签到失败\n" + JSON.stringify(data));
        } finally {
          resolve();
        }
      });
    });
  });
}
