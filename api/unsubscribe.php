<?php
define("DB_JSON", dirname(__FILE__)."/../db/db.json");

$rest_json = file_get_contents("php://input");
$post_array = json_decode($rest_json, true);

$db = json_decode(file_get_contents(DB_JSON), true);

// 送られてきた ID と一致する ID がある場合は項目を削除
foreach ($db as $index => $entry) {
    if ($entry['id'] == $post_array['id']) {
        unset($db[$index]);
    }
}

if (file_put_contents(DB_JSON, json_encode(array_values($db), JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT), LOCK_EX)) {
    http_response_code(200);
    echo "{\"status\": true}";
} else {
    http_response_code(500);
    echo "{\"status\": false}";
}
