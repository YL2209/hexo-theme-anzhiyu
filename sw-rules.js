/**
 * @see https://kmar.top/posts/b70ec88f/
 */

module.exports.config = {
  /**
   * 与 ServiceWorker 有关的配置项
   * 若想禁止插件自动生成 sw，此项填 false 即可
   * @type ?Object|boolean
   */
  serviceWorker: {
    cacheName: "NaoKuoBlogCache"
  },
  register: {
    onerror: undefined
  },
  dom: {
    onsuccess: () => {
      caches.match('https://id.v3/').then(function (response) {
        if (response) {
          // 如果找到了匹配的缓存响应
          response.json().then(function (data) {
            naokuoSAONotify && naokuoSAONotify.SAONotify('更新通知', `已刷新缓存，更新为${data.global + "." + data.local}版本最新内容`);
          });
        } else {
          console.info('未找到匹配的缓存响应');
        }
      }).catch(function (error) {
        console.error('缓存匹配出错:', error);
      });
    },
  },
  json: {
    merge: ['page', 'archives', 'categories', 'tags']
  },
  external: {
    stable: [
      /^https:\/\/npm\.elemecdn\.com\/[^/@]+\@[^/@]+\/[^/]+\/[^/]+$/,
      /^https:\/\/npm\.onmicrosoft\.cn\/[^/@]+\@[^/@]+\/[^/]+\/[^/]+$/,
      /^https:\/\/cdn\.cbd\.int\/[^/@]+\@[^/@]+\/[^/]+\/[^/]+$/,
      /^https:\/\/cdn\.jsdelivr\.net\/npm\/[^/@]+\@[^/@]+\/[^/]+\/[^/]+$/,
    ],
    replacer: srcUrl => {
      if (srcUrl.startsWith('https://npm.elemecdn.com')) {
        const url = new URL(srcUrl)
        return [
          srcUrl,
          `https://npm.onmicrosoft.cn` + url.pathname,
          `https://cdn.cbd.int` + url.pathname,
          `https://cdn.jsdelivr.net/npm` + url.pathname
        ]
      } else {
        return srcUrl
      }
    }
  }
};

/**
 * 缓存列表 /\/|\.(js|html|css|woff2|woff|ttf|cur)$/
 * @param clean 清理全站时是否删除其缓存
 * @param match {function(URL)} 匹配规则
 */
module.exports.cacheRules = {
  simple: {
    clean: true,
    search: false,
    match: (url, $eject) => {
      const allowedHost = $eject.domain;
      return url.host === allowedHost && url.pathname.match(/(\.(js|css|json)|\/)$/)
    }
  },
  cdn: {
    clean: true,
    match: url =>
      [
        "cdn.cbd.int",
        "lf26-cdn-tos.bytecdntp.com",
        "lf6-cdn-tos.bytecdntp.com",
        "lf3-cdn-tos.bytecdntp.com",
        "lf9-cdn-tos.bytecdntp.com",
        "cdn.staticfile.org",
        "npm.elemecdn.com",
        "npm.onmicrosoft.cn",
        "fonts.gstatic.com",
        "font.onmicrosoft.cn"
      ].includes(url.host) && url.pathname.match(/\.(js|css|woff2|woff|ttf|cur)$/)
  },
  img: {
    clean: true,
    match: (url, $eject) => {
      const allowedHost = $eject.domain;
      return url.host === allowedHost && url.pathname.match(/(.*?)\.(png|jpe?g|svg|webp|gif|bmp|psd|tiff|tga|ico|eps)/)
    }
  }
  // ,
  // thirdparty: {
  //   clean: true,
  //   match: function(url) {
  //     return url.host === "unpkg.com" && url.pathname.match(/\.(png|webp)$/)
  //   }
  // }
};

/**
 * 获取一个 URL 对应的备用 URL 列表，访问顺序按列表顺序，所有 URL 访问时参数一致
 * @param srcUrl {string} 原始 URL
 * @return {{list: string[], timeout: number}} 返回 null 或不返回表示对该 URL 不启用该功能。timeout 为超时时间（ms），list 为 URL 列表，列表不包含原始 URL 表示去除原始访问
 */
module.exports.getSpareUrls = srcUrl => {
  if (srcUrl.startsWith("https://npm.elemecdn.com")) {
    return {
      timeout: 3000,
      list: [srcUrl, "https://cdn.cbd.int/".concat(new URL(srcUrl).pathname),
        "https://cdn.jsdelivr.net/npm/".concat(new URL(srcUrl).pathname)
      ]
    };
  }
};

/**
 * 获取要插入到 sw 中的变量或常量
 * @param hexo hexo 对象
 * @param rules 合并后的 sw-rules 对象
 * @return {Object} 要插入的键值对
 */
module.exports.ejectValues = (hexo, rules) => {
  return {
    domain: {
      prefix: "const",
      value: new URL(hexo.config.url).host
    }
  };
};

/**
 * @param request {Request}
 * @return {boolean}
 */
module.exports.skipRequest = request => request.url.startsWith("https://i0.hdslb.com") ||
  request.url.startsWith('https://api.i-meto.com');