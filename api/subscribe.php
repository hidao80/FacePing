<?php
define("DB_JSON", dirname(__FILE__)."/../db/db.json");

$db = json_decode(file_get_contents(DB_JSON), true);

$account = ["id" => hash('crc32b', date("Ymdhis"))];
$db[] = $account;

file_put_contents(DB_JSON, json_encode(array_values($db), JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT), LOCK_EX)
    ? http_response_code(200)
    : http_response_code(500);

echo json_encode($account);
