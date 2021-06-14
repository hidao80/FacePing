<?php
define("DB_JSON", dirname(__FILE__)."/../db/db.json");

$rest_json = file_get_contents("php://input");
$post_array = json_decode($rest_json, true);

$db = json_decode(file_get_contents(DB_JSON), true);

$db[] = ["id" => $post_array['id']];

file_put_contents(DB_JSON, json_encode($db, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT), LOCK_EX)
    ? http_response_code(200)
    : http_response_code(500);
