# Face Ping

[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE.md)
[![Not use](https://img.shields.io/badge/Framework-Not_use-blue.svg)](https://nodejs.org/ja/)
[![Language](https://img.shields.io/badge/Language-VanillaJS,_PHP-blue.svg)](https://nodejs.org/ja/)
![hidao quality](https://img.shields.io/badge/hidao-quality-orange.svg)

## 使い方

ブラウザを登録すると、1分ごとに顔写真を撮影し、サーバにアップロードされます。  
撮影した直後に画像が更新され、サーバに登録されているユーザの顔写真一覧が表示されます。

Web カメラを使用しているため、https での実行が必須です。

### 登録方法
登録ボタンをクリックします。ブラウザに紐づいたユーザ情報がブラウザとサーバに登録されます。  

### 登録解除方法
登録解除ボタンをクリックします。ブラウザに紐づいているユーザ情報がブラウザとサーバから削除されます。  

## インストール

```sh
cd /path/of/install/dir
git clone https://github.com/hidao80/FacePing.git
cd FacePing
chmod 777 photo/ db/ db/db.json
```

## ToDo

- [x] 写真の読み込みを Ajax にする
- [ ] 写真の背景をぼかす
- [ ] 現在接続していない人を表示しない
