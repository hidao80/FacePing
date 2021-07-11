'use strict';
// const DEBUG = false;
const DEBUG = true;

/**
 * getElementByIdの略記法
 * @param {String} id
 * @returns {Element}
 */
 function $(id) {
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
    $(id).innerText = msg;
    if (new URL(window.location.href).searchParams.get('s')) {
        speechSynthesis.speak(new SpeechSynthesisUtterance(script ? script : msg)); // メッセージを読み上げ
    }

    setTimeout(() => {
        $(id).innerText = '';
    }, 3000);
}

window.onload = () => {
    let db;

    // ユーザリスト JSON からユーザ人数分の video タグを作成
    const fetch_images = () => {
        fetch(`db/db.json?${new Date().getTime()}`, {
            method: "GET",
        })
        .then(response => {
            return response.json();
        })
        .then(jso => {
            $('container').innerHTML = "";

            if (DEBUG) console.log(jso);
            db = jso;

            for (const item of jso) {
                if (DEBUG) console.log(item);
                const child = document.createElement("img");
                const img = $('container').appendChild(child);
                img.src = `../photo/${item.id}.jpg?${new Date().getTime()}`;
                img.id = item.id;
                img.classList.add("face_photo");
            }
        })
        .catch(err => {
            console.log(err);
        });
    }

    function start_up(id_text) {
        navigator.mediaDevices.getUserMedia({ video: {width: 320, height:240}, audio: false })
        .then(function(stream){$('camera').srcObject = stream})
        .catch(function(err) {alert(err.name + " " + err.message)});

        setInterval(() => {
            const canvas = $('capture_image');
            const va = $('camera');

            canvas.width = va.videoWidth;
            canvas.height = va.videoHeight;
            canvas.getContext('2d').drawImage(va, 0, 0, va.videoWidth, va.videoHeight);

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
            .then((jso) => {
                // fetch したけど成功しなかった
                if (jso.status !== 200) {
                    announce("message", "画像の更新に失敗しました");
                    return false;
                }

                // 画像アップロード API が成功した
                fetch_images();
            })
            .catch(err => {
                console.log(err);  // エラー内容をコンソールに出力
            });
        }, 10000)
    }

    // リロード以外の方法で読み込まれたときは起動メッセージを流す
    if(performance.getEntriesByType("navigation")[0].type != "reload") {
        announce("message", "起動します");
    }

    fetch_images();

    // 登録済みなら 1分ごとにシャッターを切り、顔写真をアップロードする
    let id_text = localStorage.getItem("FacePing.id");
    if (id_text) {
        $('subscribe').style.display = 'none';
        $('unsubscribe').style.display = 'block';

        start_up(id_text);
    } else {
        $('subscribe').style.display = 'block';
        $('unsubscribe').style.display = 'none';
    }

    // 登録ボタンクリック
    $('subscribe').addEventListener('click', async () => {
        let id_text = localStorage.getItem('FacePing.id');

        // 既に登録されている ID なら
        // 登録をキャンセルする
        for (const item of await db) {
            if (item.id == id_text) {
                // announce("message", "既に登録されています");
                return;
            }
        }

        // サーバの DB に新しい ID を登録する
        fetch('api/subscribe.php', {
            method: "GET"
        })
        .then(response => {
            // fetch したけど成功しなかった
            if (response.status !== 200) {
                announce("message", "登録に失敗しました");
                return false;
            }
            return response.json();
        })
        .then(data => {
            if (DEBUG) console.log(data);

            // 登録 API が成功した
            localStorage.setItem('FacePing.id', data.id);

            // 登録解除メッセージが流れ終わったらリロードを上で設定している
            announce("message", "登録しました");

            $('subscribe').style.display = 'none';
            $('unsubscribe').style.display = 'block';

            // 写真読み込みループに入る
            start_up(data.id);
        })
        .catch(err => {
            console.log(err);  // エラー内容をコンソールに出力
        });
    });

    // 登録解除ボタンクリック
    $('unsubscribe').addEventListener('click', async () => {
        let id_text = localStorage.getItem('FacePing.id');
        if (id_text == null) {
            // 登録されていない
            announce("message", "登録されていません");
            return;
        }

        // 既に登録されている ID は登録を解除する
        for (const item of await db) {
            if (DEBUG) console.log(item);
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
                .then((jso) => {
                    // fetch したけど成功しなかった
                    if (jso.status !== 200) {
                        announce("message", "登録の解除に失敗しました");
                        return false;
                    }

                    // 登録解除 API が成功した
                    localStorage.removeItem('FacePing.id');

                    // 登録メッセージが流れ終わったらリロードを上で設定している
                    announce("message", "登録を解除しました");

                    $('subscribe').style.display = 'block';
                    $('unsubscribe').style.display = 'none';
                })
                .catch(err => {
                    console.log(err);  // エラー内容をコンソールに出力
                });
           }
        }
    });
}
