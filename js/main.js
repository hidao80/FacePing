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
 * 状態に応じてサウンドを鳴らし分ける
 * @param {boolean|String} status 
 * @returns {Promise}
 */
 function play_sound(status, sounds) {
    if (status === 'START_UP') {
        sounds.START_UP.play();
    } else if (status === 'SUBSCRIBED') {
        sounds.SUBSCRIBED.play();
    } else if (status === 'UNSUBSCRIBED') {
        sounds.UNSUBSCRIBED.play();
    } else if (status === 'WELCOME_HOME') {
        sounds.WELCOME_HOME.play();
    } else if (status === 'REGISTERED') {
        sounds.REGISTERED.play();
    } else if (status === 'NOT_SUBSCRIBED') {
        sounds.NOT_SUBSCRIBED.play();
    } else if (status === 'SUBSCRIBED_FAILED') {
        sounds.SUBSCRIBED_FAILED.play();
    } else if (status === 'UNSUBSCRIBED_FAILED') {
        sounds.UNSUBSCRIBED_FAILED.play();
    } else if (status === true) {
        sounds.OK.play();
    } else {
        sounds.NG.play();
    }
}

/**
 * UNIXTime と UA 文字列からダイジェストを作成し ID とする
 * @returns {String}
 */
async function createId() {
    const uint8  = new TextEncoder().encode(new Date().getTime() + window.navigator.userAgent)
    const digest = await crypto.subtle.digest("SHA-256", uint8);
    return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2,'0')).join('')
}

/**
 * メッセージ領域に3秒間だけメッセージを表示して消す
 * @param {String} msg 
 */
function announce(id, msg) {
    $(id).innerText = msg;

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
            headers: {
                'Content-Type': 'application/json'
            }
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
                img.src = `../photo/${item.id}.png?${new Date().getTime()}`;
                img.id = item.id;
                img.classList.add("face_photo");
            }
        })
        .catch(err => {
            console.log(err);
        });        
    }

    const start_up = (id_text) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream){$('camera').srcObject = stream})
        .catch(function(err) {alert(err.name + " " + err.message)});

        setInterval(() => {
            const canvas = $('capture_image');
            const va = $('camera');

            canvas.width = va.videoWidth;
            canvas.height = va.videoHeight;
            canvas.getContext('2d').drawImage(va, 0, 0, va.videoWidth, va.videoHeight, 0, 0, va.videoWidth* 0.5, va.videoHeight* 0.5);

            // サーバに新しい画像をアップロードする
            fetch('api/upload.php', {
                method: 'POST',
                body: JSON.stringify({
                    id: id_text,
                    img: canvas.toDataURL()
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

    const sounds = {
        "START_UP": new Howl({ src: 'sound/start_up.mp3'}),
        "SUBSCRIBED": new Howl({ src: 'sound/subscribed.mp3', end: fetch_images}),
        "UNSUBSCRIBED": new Howl({ src: 'sound/unsubscribed.mp3', end: fetch_images}),
        "WELCOME_HOME": new Howl({ src: 'sound/welcome_home.mp3'}),
        "REGISTERED": new Howl({ src: 'sound/registered.mp3'}),
        "NOT_SUBSCRIBED": new Howl({ src: 'sound/not_subscribed.mp3'}),
        "SUBSCRIBED_FAILED": new Howl({ src: 'sound/subscribed_failed.mp3'}),
        "UNSUBSCRIBED_FAILED": new Howl({ src: 'sound/unsubscribed_failed.mp3'})
    };    

    // リロード以外の方法で読み込まれたときは起動メッセージを流す
    if(performance.getEntriesByType("navigation")[0].type != "reload") {
        announce("message", "起動します");
        play_sound("START_UP", sounds);
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
                // play_sound("REGISTERED", sounds);
                return;
            }    
        }

        // 登録されていない
        id_text = await createId();

        // サーバの DB に新しい ID を登録する
        fetch('api/subscribe.php', {
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
                announce("message", "登録に失敗しました");
                play_sound("SUBSCRIBED_FAILED", sounds);
                return false;
            }
            
            // 登録 API が成功した
            localStorage.setItem('FacePing.id', id_text);

            // 登録解除メッセージが流れ終わったらリロードを上で設定している
            announce("message", "登録しました");
            play_sound("SUBSCRIBED", sounds);

            $('subscribe').style.display = 'none;;
            $('unsubscribe').style.display = 'block';

            // 写真読み込みループに入る
            start_up(id_text);
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
            play_sound("NOT_SUBSCRIBED", sounds);
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
                        play_sound("UNSUBSCRIBED_FAILED", sounds);
                        return false;
                    }
                    
                    // 登録解除 API が成功した
                    localStorage.removeItem('FacePing.id');

                    // 登録メッセージが流れ終わったらリロードを上で設定している
                    announce("message", "登録を解除しました");
                    play_sound("UNSUBSCRIBED", sounds);

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