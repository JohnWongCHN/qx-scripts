/*
 * @Author: John Wong
 * @Date: 2022-01-20 11:35:20
 * @LastEditors: John Wong
 * @LastEditTime: 2022-01-21 09:21:06
 * @FilePath: /qx-scripts/hitun-checkin.js
 * @Desc: hitun.io auto check in
 * @Version: v0.1
 */

const { resolve } = require("path/win32");

const hitun = init();

!(async () => {
  if (hitun.isRequest) {
    // get cookie
    GetCookie();
  } else if (hitun.isQuanX) {
    // run task
    const KEY = hitun.getdata("CookieHitun");
    const HitunURL = {
      url: "https://hitun.io/user/checkin",
      headers: {
        Cookie: KEY,
      },
    };
    hitun.post(HitunURL, function (error, response, data) {
      try {
        if (error) {
          throw new Error(error);
        } else {
          const Details = console.log("\n" + JSON.parse(data));
          console.log(Details);
        }
      } catch (error) {
        hitun.notify("海豚湾🐬", "每日签到", error.message);
      } finally {
        resolve();
      }
    });
  }
})()
  .catch((e) => {
    hitun.notify("海豚🐬签到", "", e.message || JSON.stringify(e));
  })
  .finally(() => {
    hitun.done();
  });

// init
function init() {
  //
  const isRequest = () => {
    return undefined === this.$request ? false : true;
  };
  const isQuanX = () => {
    return undefined === this.$task ? false : true;
  };
  const getdata = (key) => {
    if (isQuanX()) return $prefs.valueForKey(key);
  };
  const setdata = (key, val) => {
    if (isQuanX()) return $prefs.setValueForKey(key, val);
  };
  const notify = (title, subtitle, body) => {
    if (isQuanX()) $notify(title, subtitle, body);
  };
  const log = (message) => console.log(message);
  const get = (options, callback) => {
    if (isQuanX()) {
      options.method = "GET";
      $task.fetch(options).then((resp) => callback(null, {}, resp.body));
    }
  };
  const post = (options, callback) => {
    if (isQuanX()) {
      options.method = "POST";
      $task.fetch(options).then((resp) => callback(null, {}, resp.body));
    }
  };
  const done = (value = {}) => {
    $done(value);
  };
  return { isRequest, isQuanX, notify, log, getdata, setdata, get, post, done };
}

// get hitun.io cookie
function GetCookie() {
  const req = $request;
  if (req.method != "OPTIONS" && req.headers) {
    const CV = req.headers["Cookie"] || req.headers["cookie"] || "";
    const ckItems = CV.match(/(email|key|ip|uid)=.+?;/g);
    if (/^https:\/\/hitun.io\/auth\/login/.test(req.url)) {
      if (ckItems) {
        const value = CookieUpdate(null, ckItems.join(""));
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
  let type, email;
  let ip = (oldValue || newValue || "").split(/ip=(.+?);/)[1];
  let storedCookie = hitun.getdata("CookieHitun");
  let s_ip = storedCookie.split(/ip=(.+?);/)[1];
  let cookie = storedCookie;
  if (ip === s_ip) {
    type = -1;
    email = storedCookie.split(/email=(.+?);/)[1];
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
