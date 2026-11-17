/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "d48cb80dd9d09cf10d568caeb8766d22"
  }, {
    "url": "pwa-512x512.png",
    "revision": "5feddcd9a796f2eb043946dc877b9310"
  }, {
    "url": "pwa-192x192.png",
    "revision": "257bbf5f81d68bbbbc0e33446ce8a2cc"
  }, {
    "url": "index.html",
    "revision": "3c33e84efb881db156e415fc00c27c0c"
  }, {
    "url": "icon.svg",
    "revision": "530aa00db64595a7a382365ba3fdb6f7"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "010d473f09985af8d5e7f2db14c5995b"
  }, {
    "url": "src/assets/images/ironpulse_splash_emblem_1794926961620.jpg",
    "revision": "b701808d8eaf36f5de4939cc7a2160fd"
  }, {
    "url": "src/assets/images/gym_arena_backdrop_1794848258829.jpg",
    "revision": "6fa90785c23e7202d51e2c7b83be559d"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/web-tUCbJteC.js",
    "revision": null
  }, {
    "url": "assets/web-DcUe4xcj.js",
    "revision": null
  }, {
    "url": "assets/ironpulse_splash_emblem_1794926961620-DAUEbrK4.jpg",
    "revision": null
  }, {
    "url": "assets/index-DGycTM0k.js",
    "revision": null
  }, {
    "url": "assets/index-CrgM3SJ2.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "010d473f09985af8d5e7f2db14c5995b"
  }, {
    "url": "icon.svg",
    "revision": "530aa00db64595a7a382365ba3fdb6f7"
  }, {
    "url": "pwa-192x192.png",
    "revision": "257bbf5f81d68bbbbc0e33446ce8a2cc"
  }, {
    "url": "pwa-512x512.png",
    "revision": "5feddcd9a796f2eb043946dc877b9310"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "d48cb80dd9d09cf10d568caeb8766d22"
  }, {
    "url": "manifest.webmanifest",
    "revision": "f7b278437377ba329d281190bf6c3f0d"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/__/]
  }));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
