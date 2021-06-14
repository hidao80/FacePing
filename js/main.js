'use strict';
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
    const sounds = {
        "START_UP": new Howl({ src: 'sound/start_up.mp3'}),
        "SUBSCRIBED": new Howl({ src: 'sound/subscribed.mp3'}),
        "UNSUBSCRIBED": new Howl({ src: 'sound/unsubscribed.mp3'}),
        "WELCOME_HOME": new Howl({ src: 'sound/welcome_home.mp3'}),
        "REGISTERED": new Howl({ src: 'sound/registered.mp3'}),
        "NOT_SUBSCRIBED": new Howl({ src: 'sound/not_subscribed.mp3'}),
        "SUBSCRIBED_FAILED": new Howl({ src: 'sound/subscribed_failed.mp3'}),
        "UNSUBSCRIBED_FAILED": new Howl({ src: 'sound/unsubscribed_failed.mp3'})
    };

    // メッセージが流れ終わったらリロード
    sounds.SUBSCRIBED.on("end", () => {location.reload();});
    sounds.UNSUBSCRIBED.on("end", () => {location.reload();});

    let db; 

    // リロード以外の方法で読み込まれたときは起動メッセージを流す
    if(performance.getEntriesByType("navigation")[0].type != "reload") {
        announce("message", "起動します");
        play_sound("START_UP", sounds);
    }    

    // 登録済みなら 1分ごとにシャッターを切り、顔写真をアップロードする
    let id_text =localStorage.getItem("FacePing.id");
    if (id_text) {
        navigator.mediaDevices.getUserMedia({ video: {facingMode: "user"}, audio: false })
            .then(function(stream){$('camera').srcObject = stream})
            .catch(function(err) {alert(err.name + " " + err.message)});


        setInterval(() => {
            const canvas_capture_image = $('capture_image');
            const ctx = canvas_capture_image.getContext('2d');
            const va = $('camera');
    
            canvas_capture_image.width = va.videoWidth;
            canvas_capture_image.height = va.videoHeight;
            ctx.drawImage(va, 0, 0, va.videoWidth, va.videoHeight, 0, 0, va.videoWidth, va.videoHeight);
            console.log(canvas_capture_image.toDataURL());

            // サーバに新しい画像をアップロードする
            fetch('api/upload.php', {
                method: 'POST',
                body: JSON.stringify({
                    id: id_text,
                    img: canvas_capture_image.toDataURL()
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
                // おいおい Ajax にするけど、とりあえずリロードで画像更新
                location.reload();
            })
            .catch(err => {
                console.log(err);  // エラー内容をコンソールに出力
            });
        }, 600000)
    }

    // ユーザリスト JSON からユーザ人数分の video タグを作成
    fetch("db/db.json", {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(async response => {
        if (!response.status) {
            return false;
        }
        db = response.json();

        for (const item of await db) {
            console.log(item);
            const child = document.createElement("img");
            const img = $('container').appendChild(child);
            img.setAttribute('src', `../photo/${item.id}.png`);
            img.setAttribute('id', item.id);
            img.classList.add("face_photo");
        }
    })
    .catch(err => {
        console.log(err);
    });

    // 登録ボタンクリック
    $('subscribe').addEventListener('click', async () => {
        let id_text = localStorage.getItem('FacePing.id');

        // 既に登録されている ID なら
        // 登録をキャンセルする
        for (const item of await db) {
            if (item.id == id_text) {
                announce("message", "既に登録されています");
                play_sound("REGISTERED", sounds);
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
            // console.log(item);
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
                })
                .catch(err => {
                    console.log(err);  // エラー内容をコンソールに出力
                });
           }    
        }
    });
}