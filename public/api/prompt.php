<?php
// Simple server endpoint to call OpenAI without exposing your API key.
// Configure in Apache .htaccess (subdomain root):
//   SetEnv OPENAI_API_KEY "sk-..."
// Optional diagnostics (only enable temporarily):
//   SetEnv ALLOW_PROMPT_DIAG 1

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Expose-Headers: *');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  http_response_code(204);
  exit;
}

function read_env_key() {
  $candidates = [
    getenv('OPENAI_API_KEY') ?: null,
    isset($_SERVER['OPENAI_API_KEY']) ? $_SERVER['OPENAI_API_KEY'] : null,
    isset($_SERVER['REDIRECT_OPENAI_API_KEY']) ? $_SERVER['REDIRECT_OPENAI_API_KEY'] : null,
    isset($_ENV['OPENAI_API_KEY']) ? $_ENV['OPENAI_API_KEY'] : null,
  ];
  foreach ($candidates as $v) {
    if (is_string($v) && trim($v) !== '') return trim($v);
  }
  return '';
}

// Lightweight diagnostics to help configuration on shared hosts
if (isset($_GET['diag'])) {
  $allow = getenv('ALLOW_PROMPT_DIAG');
  if ($allow === '1') {
    $hasCurl = function_exists('curl_init');
    $diag = [
      'method' => $_SERVER['REQUEST_METHOD'],
      'php_sapi' => php_sapi_name(),
      'has_curl' => $hasCurl,
      'curl_version' => $hasCurl ? curl_version() : null,
      'key_sources' => [
        'getenv' => (bool)(getenv('OPENAI_API_KEY')),
        '_SERVER' => isset($_SERVER['OPENAI_API_KEY']),
        'REDIRECT_OPENAI_API_KEY' => isset($_SERVER['REDIRECT_OPENAI_API_KEY']),
        '_ENV' => isset($_ENV['OPENAI_API_KEY']),
      ],
    ];
    echo json_encode($diag);
  } else {
    echo json_encode(['error' => ['message' => 'Diagnostics disabled']]);
  }
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode([ 'error' => [ 'message' => 'Method Not Allowed' ] ]);
  exit;
}

$apiKey = read_env_key();
if (!$apiKey) {
  http_response_code(500);
  echo json_encode([ 'error' => [ 'message' => 'Server not configured: missing OPENAI_API_KEY' ] ]);
  exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) { $payload = []; }

// Whitelist relevant fields
$model = isset($payload['model']) ? (string)$payload['model'] : 'gpt-4o-mini';
$messages = isset($payload['messages']) && is_array($payload['messages']) ? $payload['messages'] : [];
$temperature = isset($payload['temperature']) ? floatval($payload['temperature']) : 1.0;
$maxTokens = isset($payload['max_tokens']) ? intval($payload['max_tokens']) : null;

if (!$messages) {
  // Provide a reasonable default if none supplied
  $messages = [ [ 'role' => 'user', 'content' => 'Give me one short writing prompt for today.' ] ];
}

$out = [
  'model' => $model,
  'messages' => $messages,
  'temperature' => $temperature,
];
if ($maxTokens !== null) { $out['max_tokens'] = $maxTokens; }

$url = 'https://api.openai.com/v1/chat/completions';

// Prefer cURL, fall back to streams if unavailable
if (function_exists('curl_init')) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
      'Authorization: Bearer ' . $apiKey,
      'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode($out),
  ]);
  $resp = curl_exec($ch);
  $err = curl_error($ch);
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($resp === false) {
    http_response_code(502);
    echo json_encode([ 'error' => [ 'message' => 'Upstream error (curl)', 'detail' => $err ] ]);
    exit;
  }
  http_response_code($status ?: 200);
  echo $resp;
  exit;
}

// streams fallback
$opts = [
  'http' => [
    'method' => 'POST',
    'header' => [
      'Authorization: Bearer ' . $apiKey,
      'Content-Type: application/json'
    ],
    'content' => json_encode($out),
    'ignore_errors' => true,
    'timeout' => 30,
  ]
];
$context = stream_context_create($opts);
$resp = @file_get_contents($url, false, $context);
$status = 0;
if (isset($http_response_header) && is_array($http_response_header)) {
  foreach ($http_response_header as $h) {
    if (preg_match('#^HTTP/\S+\s+(\d{3})#', $h, $m)) { $status = intval($m[1]); break; }
  }
}
if ($resp === false) {
  http_response_code(502);
  echo json_encode([ 'error' => [ 'message' => 'Upstream error (streams)' ] ]);
  exit;
}
http_response_code($status ?: 200);
echo $resp;
?>
