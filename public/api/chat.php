<?php
/**
 * STAR AV ASSIST — Gemini proxy for Hostinger (PHP / Apache / LiteSpeed).
 *
 * The React app (static files in the same web root) calls POST /api/chat.php.
 * This script keeps GEMINI_API_KEY server-side, grounds Gemini on the product
 * catalogue (api/ai-context.json, emitted at build time), and returns the same
 * structured JSON the frontend already understands:
 *   { intent, response, products[], showProductCard }
 *
 * The key is NEVER exposed to the browser. Errors are returned as generic
 * messages (no key, no stack traces, no upstream detail).
 */

header('Content-Type: application/json; charset=utf-8');

// ---- only POST ----
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed']);
    exit;
}

// ---- resolve the API key (server-side only) ----
function av_load_env_key() {
    // 1) real environment variable (Hostinger hPanel / .htaccess SetEnv)
    $k = getenv('GEMINI_API_KEY');
    if ($k) return trim($k);
    // 2) a .env file — checked from safest (above web root) to least
    $candidates = [
        __DIR__ . '/../../.env',   // one level ABOVE public_html (recommended)
        __DIR__ . '/../.env',      // web root
        __DIR__ . '/.env',         // /api/.env
    ];
    foreach ($candidates as $path) {
        if (is_readable($path)) {
            foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#') continue;
                $pos = strpos($line, '=');
                if ($pos === false) continue;
                $name = trim(substr($line, 0, $pos));
                if ($name === 'GEMINI_API_KEY') {
                    $val = trim(substr($line, $pos + 1));
                    $val = trim($val, "\"'");
                    if ($val !== '') return $val;
                }
            }
        }
    }
    return null;
}

function av_env_value($name, $default = null) {
    $v = getenv($name);
    return ($v !== false && $v !== '') ? trim($v) : $default;
}

$apiKey = av_load_env_key();
if (!$apiKey) {
    http_response_code(503);
    echo json_encode(['error' => 'gemini_not_configured']);
    exit;
}

// ---- load grounding context (built into api/ai-context.json) ----
$ctxRaw = @file_get_contents(__DIR__ . '/ai-context.json');
$ctx = $ctxRaw ? json_decode($ctxRaw, true) : null;
if (!$ctx) {
    http_response_code(500);
    echo json_encode(['error' => 'ai_context_missing']);
    exit;
}
$model = av_env_value('GEMINI_MODEL', $ctx['defaults']['model'] ?? 'gemini-2.0-flash');
$temperature = $ctx['defaults']['temperature'] ?? 0.6;

// ---- read request body ----
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) $input = [];
$messages = isset($input['messages']) && is_array($input['messages']) ? $input['messages'] : [];
$session = isset($input['session']) && is_array($input['session']) ? $input['session'] : [];

// ---- build system instruction ----
$systemInstruction = ($ctx['systemPrompt'] ?? '')
    . "\nPRODUCT CATALOG (source of truth, JSON):\n" . json_encode($ctx['catalog'])
    . (count($session) ? "\nKNOWN CONTEXT so far (JSON):\n" . json_encode($session) : "")
    . "\nOUTPUT FORMAT:\n" . ($ctx['outputRules'] ?? '');

// ---- build contents from the full conversation ----
$contents = [];
foreach ($messages as $m) {
    if (!isset($m['content']) || $m['content'] === '') continue;
    $role = (isset($m['role']) && $m['role'] === 'assistant') ? 'model' : 'user';
    $contents[] = ['role' => $role, 'parts' => [['text' => (string)$m['content']]]];
}

$payload = [
    'systemInstruction' => ['parts' => [['text' => $systemInstruction]]],
    'contents' => $contents,
    'generationConfig' => [
        'temperature' => $temperature,
        'responseMimeType' => 'application/json',
        'responseSchema' => [
            'type' => 'object',
            'properties' => [
                'intent' => ['type' => 'string'],
                'response' => ['type' => 'string'],
                'products' => ['type' => 'array', 'items' => ['type' => 'string']],
                'showProductCard' => ['type' => 'boolean'],
                'showWhatsApp' => ['type' => 'boolean'],
            ],
            'required' => ['intent', 'response', 'showProductCard'],
        ],
    ],
];

// ---- call Gemini ----
$url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model)
     . ':generateContent?key=' . urlencode($apiKey);

// one retry on transient (5xx / network) failures for resilience
$resp = false; $httpCode = 0; $curlErr = '';
for ($attempt = 0; $attempt < 2; $attempt++) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 30,
    ]);
    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);
    if ($resp !== false && $httpCode >= 200 && $httpCode < 300) break;
    if ($httpCode >= 400 && $httpCode < 500) break; // client error won't change on retry
    if ($attempt === 0) usleep(600000); // 0.6s before the single retry
}

if ($resp === false || $httpCode < 200 || $httpCode >= 300) {
    // log server-side only; never leak the key or upstream detail to the client
    error_log('[av-assist] Gemini error http=' . $httpCode . ' curl=' . $curlErr);
    http_response_code(502);
    echo json_encode(['error' => 'ai_unavailable']);
    exit;
}

// ---- parse Gemini response ----
$data = json_decode($resp, true);
$text = '';
if (isset($data['candidates'][0]['content']['parts']) && is_array($data['candidates'][0]['content']['parts'])) {
    foreach ($data['candidates'][0]['content']['parts'] as $p) {
        if (isset($p['text'])) $text .= $p['text'];
    }
}
$parsed = json_decode($text, true);
if (!is_array($parsed)) {
    $parsed = ['intent' => 'GENERAL_AV_QUESTION', 'response' => ($text !== '' ? $text : 'Sorry, could you rephrase that?'), 'products' => [], 'showProductCard' => false];
}

// ---- sanitise product IDs against the real catalogue ----
$valid = array_flip($ctx['validProductIds'] ?? []);
$products = [];
if (isset($parsed['products']) && is_array($parsed['products'])) {
    foreach ($parsed['products'] as $id) {
        if (isset($valid[$id])) $products[] = $id;
    }
}

echo json_encode([
    'intent' => $parsed['intent'] ?? 'OTHER',
    'response' => $parsed['response'] ?? '',
    'products' => $products,
    'showProductCard' => (!empty($parsed['showProductCard']) && count($products) > 0),
    'showWhatsApp' => !empty($parsed['showWhatsApp']),
]);
