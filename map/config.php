<?php
// config.php — безопасный конфиг для Trans-Time
header('Content-Type: application/javascript');
header('Cache-Control: no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Защита по Referer
$allowed_hosts = [
    'trans-time.ru',
    'www.trans-time.ru'
];

$referer = $_SERVER['HTTP_REFERER'] ?? '';
$host = parse_url($referer, PHP_URL_HOST);

if ($referer && $host) {
    $valid = false;
    foreach ($allowed_hosts as $h) {
        if (stripos($host, $h) !== false) {
            $valid = true;
            break;
        }
    }
    if (!$valid) {
        http_response_code(403);
        exit('// Access denied: invalid referer');
    }
}

// Конфиг с Key #1 (работает!)
$config = [
    'yandex' => [
        'apiKey' => '317aa42d-aa15-4acf-885a-6d6bfddb2339', // ← Key #1
        'suggestKey' => '317aa42d-aa15-4acf-885a-6d6bfddb2339',
        'lang' => 'ru_RU',
        'version' => '2.1.95'
    ],
    'map' => [
        'center' => [55.751244, 37.618423],
        'zoom' => 8
    ],
    'debug' => true
];

echo "window.TRANSTIME_CONFIG = " . json_encode($config, JSON_UNESCAPED_UNICODE) . ";";
?>