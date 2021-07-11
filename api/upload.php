<?php
$rest_json = file_get_contents("php://input");
$post_array = json_decode($rest_json, true);

// error_log(print_r($post_array, true), "3", "./php.log");

$img = str_replace('data:image/jpeg;base64,', '', $post_array['img']);  // 冒頭の部分を削除
$img = str_replace(' ', '+', $img);  // 空白を'+'に変換

// base64デコード
$image = base64_decode($img);

//MIMEタイプから拡張子を選択してファイル名を作成
$filename = dirname(__FILE__)."/../photo/{$post_array['id']}.jpg";

// 画像ファイルの保存
if (file_put_contents($filename, $image, LOCK_EX)) {
    http_response_code(200);
    $json = ['status' => true];
} else {
    http_response_code(500);
    $json = ['status' => false];
}
echo json_encode($json);
