<?php
// Simple ICS proxy for shared hosting (e.g., Bluehost)
// Usage: /proxy-ics.php?url=https%3A%2F%2F...
// Adds CORS and avoids browser CORS limits when fetching ICS feeds.

// Normalize and validate URL
$url = isset($_GET['url']) ? $_GET['url'] : '';
if (!$url) { http_response_code(400); echo 'Invalid url'; exit; }
$url = preg_replace('/^webcal:/i', 'https:', $url);
if (!preg_match('~^https://~i', $url)) { http_response_code(400); echo 'Invalid url'; exit; }

// Basic SSRF guard
$host = parse_url($url, PHP_URL_HOST);
if (!$host || preg_match('/^(localhost|127\.|0\.0\.0\.0)$/i', $host)) {
  http_response_code(400); echo 'Blocked host'; exit;
}

// Fetch via cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);
curl_setopt($ch, CURLOPT_USERAGENT, 'PlannerICS/1.0 (+https://example.com)');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Accept: text/calendar, text/plain, */*;q=0.1'
]);
$data = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$ctype = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$err = curl_error($ch);
curl_close($ch);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Expose-Headers: *');
if (!$ctype) { $ctype = 'text/calendar; charset=utf-8'; }
header('Content-Type: ' . $ctype);

if (!$status) { $status = 502; }
http_response_code($status);

if ($data === false) {
  echo 'Proxy error';
} else {
  echo $data;
}
?>

