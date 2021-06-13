<?php
$rest_json = file_get_contents("php://input");
$post_array = json_decode($rest_json, true);

error_log(print_r($post_array, true), "3", "./php.log");

$img = str_replace('data:image/png;base64,', '', $post_array['img']);  // 冒頭の部分を削除
$img = str_replace(' ', '+', $img);  // 空白を'+'に変換

// base64デコード
$iamge = base64_decode($img);

// finfo_bufferでMIMEタイプを取得
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime_type = finfo_buffer($finfo, $iamge);

//MIMEタイプをキーとした拡張子の配列
$extensions = [
    'image/gif' => 'gif',
    'image/jpeg' => 'jpg',
    'image/png' => 'png'
];

//MIMEタイプから拡張子を選択してファイル名を作成
$filename = "../photo/{$post_array['id']}.{$extensions[$mime_type]}";

// 画像ファイルの保存
file_put_contents($filename, $iamge, LOCK_EX)
    ? http_response_code(200)
    : http_response_code(500);
