'use strict';
const global = {
    db: {},
    DEBUG: true,
    IMAGE_UPDATE_INTERVAL: 10000,  // 10秒に一度更新
    TYPE_RELOAD: 1
}
import debug from "./debugTablet.js";

/**
 * getElementByIdの略記法
 * @param {String} id
 * @returns {Element}
 */
 function _$(id) {
    return document.getElementById(id);
  }

 /**
 * querySelectorAllの略記法
 * @param {String} selector
 * @returns {array<Element>}
 */
function $$(selector) {
    return document.querySelectorAll(selector);
}

/**
 * メッセージ領域に3秒間だけメッセージを表示して消す
 * @param {String} msg
 * @param {String} script メッセージ（カナ）
 */
function announce(id, msg, script) {
    _$(id).innerText = msg;
    if (new URL(window.location.href).searchParams.get('s')) {
        speechSynthesis.cancel(); // 喋っているのをキャンセルする。読み上げなくなった時もこれで直る
        speechSynthesis.speak(new SpeechSynthesisUtterance(script ? script : msg)); // メッセージを読み上げ
    }

    setTimeout(() => {
        _$(id).innerText = '';
    }, 3000);
}

/**
 *  ユーザリスト JSON からユーザ人数分の video タグを作成
 */
function fetch_images() {
    if(global.DEBUG) console.log("fetch_images: in");
    fetch(`db/db.json?${new Date().getTime()}`)
    .then(response => {
        if(global.DEBUG) console.log("fetch_images: " + response.status);

        // fetch したけど成功しなかった
        if (response.status != 200) {
            if(global.DEBUG) console.log("画像の更新に失敗しました");
            announce("message", "画像の更新に失敗しました");
            return false;
        }
        return response.json();
    })
    .then(jso => {
        if(global.DEBUG) console.log(jso);
        if (jso) {
            _$('container').innerHTML = "";

            if(global.DEBUG) console.log(jso);
            global.db = jso;

            for (const item of jso) {
                if(global.DEBUG) console.log(item);
                const child = document.createElement("img");
                const img = _$('container').appendChild(child);
                img.src = `../photo/${item.id}.jpg?${new Date().getTime()}`;
                img.id = item.id;
                img.classList.add("face_photo");
            }
        }
    })
    .catch(err => {
        if(global.DEBUG) console.log(err);
    });
}

/**
 * 利用の開始
 * @param {string} 接続ユーザの ID（自動採番）
 */
function start_up(id_text) {
    // カメラの初期化
    navigator.mediaDevices.getUserMedia({ video: {width: 320, height:240}, audio: false })
    .then(function(stream){_$('camera').srcObject = stream})
    .catch(function(err) {alert(err.name + " " + err.message)});

    setInterval(() => {
        const canvas = _$('capture_image');
        const va = _$('camera');

        // キャンバスにカメラ映像の 1フレームだけコピー
        canvas.width = va.videoWidth;
        canvas.height = va.videoHeight;
        canvas.getContext('2d').drawImage(va, 0, 0);

        if(global.DEBUG) console.log("fetch(upload)");
        // サーバに新しい画像をアップロードする
        fetch('api/upload.php', {
            method: 'POST',
            body: JSON.stringify({
                id: id_text,
                img: canvas.toDataURL("image/jpeg", 0.8)
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if(global.DEBUG) console.log("Upload: " + response.status);
            // const src = canvas.toDataURL("image/jpeg", 0.8);
            // if(global.DEBUG) console.log(`<img src="${src}">`);

            // fetch したけど成功しなかった
            if (response.status !== 200) {
                if(global.DEBUG) console.log("画像の更新に失敗しました");
                announce("message", "画像の更新に失敗しました");
                return false;
            }

            // 画像アップロード API が成功した
            if(global.DEBUG) console.log("start fetch_images():");
            fetch_images();
        })
        .catch(err => {
            if(global.DEBUG) console.log(err);  // エラー内容をコンソールに出力
        });
    }, global.IMAGE_UPDATE_INTERVAL)
}

window.onload = () => {
    // デバッグフラグの設定
    global.DEUBG = new URL(window.location.href).searchParams.get('DEBUG') ? true : false;

    // デバッグ昨日の初期化
    debug.init(global.DEUBG);
    // debug.alignRight(true);

    // リロード以外の方法で読み込まれたときは起動メッセージを流す
    let isIos = true;
    if (performance?.getEntriesByType("navigation")[0]?.type != undefined
        && performance?.getEntriesByType("navigation")[0]?.type != "reload"
    ) {
        isIos = false;
        announce("message", "起動します");
    }
    if (isIos && performance?.navigation?.type !== global.TYPE_RELOAD) {
        announce("message", "起動します");
        if(global.DEBUG) console.log(performance?.navigation?.type, global.TYPE_RELOAD);
    }

    fetch_images();
    start_up();

    // 登録済みなら 1分ごとにシャッターを切り、顔写真をアップロードする
    let id_text = localStorage.getItem("FacePing.id");
    if (id_text) {
        _$('subscribe').style.display = 'none';
        _$('unsubscribe').style.display = 'block';

        start_up(id_text);
    } else {
        _$('subscribe').style.display = 'block';
        _$('unsubscribe').style.display = 'none';
    }

    // 登録ボタンクリック
    _$('subscribe').addEventListener('click', () => {
        let id_text = localStorage.getItem('FacePing.id');

        // 既に登録されている ID なら
        // 登録をキャンセルする
        for (const item of global.db) {
            if (item.id == id_text) {
                announce("message", "既に登録されています");
                return;
            }
        }

        // サーバの DB に新しい ID を登録する
        fetch('api/subscribe.php')
        .then(response => {
            // fetch したけど成功しなかった
            if (response.status !== 200) {
                announce("message", "登録に失敗しました");
                return false;
            }
            return response.json();
        })
        .then(jso => {
            if (jso) {
                // 登録 API が成功した
                localStorage.setItem('FacePing.id', jso.id);

                // 登録解除メッセージが流れ終わったらリロードを上で設定している
                announce("message", "登録しました");

                _$('subscribe').style.display = 'none';
                _$('unsubscribe').style.display = 'block';

                // 写真読み込みループに入る
                start_up(jso.id);
            }
        })
        .catch(err => {
            if(global.DEBUG) console.log(err);  // エラー内容をコンソールに出力
        });
    });

    // 登録解除ボタンクリック
    _$('unsubscribe').addEventListener('click', () => {
        const id_text = localStorage.getItem('FacePing.id');
        if (id_text == null) {
            // 登録されていない
            announce("message", "登録されていません");
            return;
        }

        // 既に登録されている ID は登録を解除する
        for (const item of global.db) {
            if (global.DEBUG) if(global.DEBUG) console.log(item);
            if (item.id == id_text) {
                // サーバの DB から ID を削除する
                fetch('api/unsubscribe.php', {
                    method: 'POST',
                    body: JSON.stringify({
                        id: id_text
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    // fetch したけど成功しなかった
                    if (response.status !== 200) {
                        announce("message", "登録の解除に失敗しました");
                        return false;
                    }
                    if(global.DEBUG) console.log(response);
                    return response.json();
                })
                .then(jso => {
                    if (jso.status) {
                        // 登録解除 API が成功した
                        localStorage.removeItem('FacePing.id');

                        // 登録メッセージが流れ終わったらリロードを上で設定している
                        announce("message", "登録を解除しました");

                        _$('subscribe').style.display = 'block';
                        _$('unsubscribe').style.display = 'none';
                    }
                })
                .catch(err => {
                    if(global.DEBUG) console.log(err);  // エラー内容をコンソールに出力
                });
           }
        }
    });
}
