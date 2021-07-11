<?php
$DEBUG = true;
$update = $DEBUG ? date("Ymdhis") : "";
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Face Ping</title>
    <link defer rel="stylesheet" href="css/style.css?<?= $update ?>">
    <script defer src="js/main.js?<?= $update ?>" type="module"></script>
</head>
<body>
    <nav>
        <div id="message"></div>
        <div id="subscribe">登録</div>
        <div id="unsubscribe">登録解除</div>
    </nav>
    <container id="container">

    </container>
    <video id="camera" autoplay playsinline></video>
    <canvas id="capture_image"></canvas>
</body>
</html>
