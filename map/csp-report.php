<?php
$raw = file_get_contents('php://input');
if (!$raw) { http_response_code(204); exit; }
$dir = __DIR__ . '/../logs';
if (!is_dir($dir)) mkdir($dir, 0775, true);
$logFile = $dir . '/csp.log';
$line = date('c') . ' ' . $raw . PHP_EOL;
file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
header('Content-Type: application/json'); echo json_encode(['ok'=>1]);
