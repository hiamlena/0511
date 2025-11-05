<?php
/**
 * Trans-Time /map — server-side code scanner
 * v1.2 (30.10.2025)
 * GET:
 *   ?key=SECRET     — опциональный токен
 *   ?fmt=json|html  — формат вывода (html по умолчанию)
 *   ?dir=subdir     — подпапка относительно /map (по умолчанию .)
 */

$SECRET   = 'TT_SCAN_SECRET_123';   // поменяй при желании, или оставь пустым ''
$ALLOW_IP = [];                     // например: ['91.200.148.99']; пустой — без фильтра IP

// --- Access control ---
if (!empty($ALLOW_IP) && !in_array($_SERVER['REMOTE_ADDR'] ?? '', $ALLOW_IP, true)) {
  http_response_code(403); exit('forbidden ip');
}
if ($SECRET !== '' && ($_GET['key'] ?? '') !== $SECRET) {
  http_response_code(403); exit('forbidden');
}
// -----------------------

$base = realpath(__DIR__);
$root = realpath($base . '/' . ($_GET['dir'] ?? '.'));
if (!$root || strpos($root, $base) !== 0) {
  http_response_code(400); exit('bad dir');
}

$extAllow = ['js','html','htm','php','css','htaccess','json'];
$issues = []; $files = 0;

function add_issue(&$arr, $type, $file, $line, $msg, $sev='warn'){
  $rel = str_replace($_SERVER['DOCUMENT_ROOT'], '', $file);
  $arr[] = ['type'=>$type,'file'=>$rel,'line'=>$line,'message'=>$msg,'severity'=>$sev];
}

function scan_file($path, &$issues){
  $bn = basename($path);
  $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
  if ($bn === '.htaccess') $ext = 'htaccess';
  if (!in_array($ext, ['js','html','htm','php','css','htaccess','json'])) return;

  $txt = @file_get_contents($path);
  if ($txt === false) return;

  $lines = explode("\n", $txt);

  // 1) Обрезки "..."
  foreach ($lines as $i=>$ln) {
    if (strpos($ln, '...') !== false) add_issue($issues,'ellipsis',$path,$i+1,'Встречено "..." — возможный обрез кода','error');
  }

  // 2) Яндекс API без apikey
  if (preg_match('/api-maps\\.yandex\\.ru\\/2\\.1\\/\\?[^"\n]*/i', $txt) && !preg_match('/apikey=/i', $txt)) {
    add_issue($issues,'yandex_api',$path,0,'Загрузка Yandex API без apikey','error');
  }

  // 3) HTML: meta-CSP, inline style/script
  if (in_array($ext, ['html','htm'])) {
    if (preg_match('/<meta\\s+http-equiv=[\'"]Content-Security-Policy[\'"]/i', $txt)) {
      add_issue($issues,'csp_meta',$path,0,'Найдена meta-CSP — лучше убрать, используем серверную CSP','warn');
    }
    if (preg_match('/\\sstyle=\\s*["\']/', $txt)) {
      add_issue($issues,'inline_style',$path,0,'Есть inline style= — мешает строгой CSP','info');
    }
    if (preg_match('/<script[^>]*>\\s*[^<]/i', $txt)) {
      add_issue($issues,'inline_script',$path,0,'Есть inline <script> — вынести в .js для строгой CSP','info');
    }
  }

  // 4) .htaccess: дубли и обратные слэши в CSP
  if ($bn === '.htaccess') {
    if (preg_match_all('/Content-Security-Policy/i', $txt) > 1) {
      add_issue($issues,'csp_dup',$path,0,'Несколько CSP в .htaccess — оставь одну','error');
    }
    if (preg_match('/\\\\\\s*\\n/', $txt)) {
      add_issue($issues,'csp_multiline',$path,0,'CSP многострочная с \\\\ — риск 500','error');
    }
  }

  // 5) Внешние домены (для сверки с CSP)
  if (preg_match_all('/https?:\\/\\/[a-z0-9.-]+/i', $txt, $m)) {
    foreach (array_unique($m[0]) as $d) {
      if (preg_match('~^https?://(trans-time\\.ru|www\\.trans-time\\.ru)~i', $d)) continue;
      add_issue($issues,'external',$path,0,'Внешний ресурс: '.$d,'info');
    }
  }
}

$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
foreach ($it as $f) { $files++; scan_file($f->getPathname(), $issues); }

usort($issues, function($a,$b){
  $sev = ['error'=>3,'warn'=>2,'info'=>1];
  return ($sev[$b['severity']] <=> $sev[$a['severity']]) ?: strcmp($a['file'],$b['file']) ?: ($a['line'] <=> $b['line']);
});

$fmt = strtolower($_GET['fmt'] ?? 'html');
if ($fmt === 'json') {
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['scanned'=>$files,'issues'=>$issues], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  exit;
}

header('Content-Type: text/html; charset=utf-8'); ?>
<!doctype html><meta charset="utf-8"/>
<title>TT Debug Scan</title>
<style>
  body{font:14px/1.5 system-ui,Segoe UI,Roboto;margin:20px;background:#0b1020;color:#e5e7eb}
  h1{font-size:18px;margin:0 0 12px}
  .muted{opacity:.75}
  table{border-collapse:collapse;width:100%;background:#0f172a;border:1px solid #1f2a44}
  th,td{border-bottom:1px solid #1f2a44;padding:8px 10px;text-align:left;vertical-align:top}
  .error{color:#ef4444}.warn{color:#f59e0b}.info{color:#60a5fa}
  .badge{display:inline-block;padding:1px 6px;border-radius:999px;border:1px solid #1f2a44;background:#111827}
</style>
<h1>Trans-Time: скан /map <span class="muted">(файлов: <?= (int)$files ?>)</span></h1>
<?php if(!$issues){ ?>
  <p class="info">✅ Ничего подозрительного не найдено.</p>
<?php } else { ?>
  <table>
    <tr><th>Сев.</th><th>Тип</th><th>Файл</th><th>Строка</th><th>Сообщение</th></tr>
    <?php foreach($issues as $it){ ?>
      <tr>
        <td class="<?=htmlspecialchars($it['severity'])?>"><?=htmlspecialchars($it['severity'])?></td>
        <td><span class="badge"><?=htmlspecialchars($it['type'])?></span></td>
        <td><?=htmlspecialchars($it['file'])?></td>
        <td><?= (int)$it['line'] ?></td>
        <td><?=htmlspecialchars($it['message'])?></td>
      </tr>
    <?php } ?>
  </table>
<?php } ?>
