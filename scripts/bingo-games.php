<?php
/**
 * Bingo 游戏状态共享 API（局域网多终端同步）
 * GET  - 返回全部进行中的游戏
 * POST - 合并上传的游戏状态（按 updatedAt 取新）
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$dataDir = dirname(__DIR__) . '/data';
$dataFile = $dataDir . '/bingo-games.json';

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0775, true);
}
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, '{}');
}

function load_games(string $path): array
{
    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function save_games(string $path, array $games): bool
{
    $json = json_encode($games, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($json === false) {
        return false;
    }
    $tmp = $path . '.tmp.' . getmypid();
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    return rename($tmp, $path);
}

function game_timestamp(array $game): int
{
    return (int)($game['updatedAt'] ?? $game['createdAt'] ?? 0);
}

function merge_games(array $base, array $incoming): array
{
    foreach ($incoming as $id => $game) {
        if (!is_array($game)) {
            continue;
        }
        $gid = (string)($game['id'] ?? $id);
        if (!isset($base[$gid]) || game_timestamp($game) >= game_timestamp($base[$gid])) {
            $base[$gid] = $game;
        }
    }
    return $base;
}

function prune_old_games(array $games, int $maxAgeSec = 86400): array
{
    $now = time() * 1000;
    foreach ($games as $id => $game) {
        if (!is_array($game)) {
            unset($games[$id]);
            continue;
        }
        $status = $game['status'] ?? 'active';
        $ts = game_timestamp($game);
        $poolEmpty = empty($game['pool']);
        if ($status === 'aborted' || ($status === 'finished' && $poolEmpty)) {
            if ($now - $ts > $maxAgeSec) {
                unset($games[$id]);
            }
        }
    }
    return $games;
}

function apply_game_timeouts(array $games, int $maxDurationMs = 18000000): array
{
    $now = (int)(microtime(true) * 1000);
    foreach ($games as $id => $game) {
        if (!is_array($game)) {
            continue;
        }
        if (($game['status'] ?? '') === 'aborted') {
            continue;
        }
        $created = (int)($game['createdAt'] ?? 0);
        if ($created <= 0 || ($now - $created) < $maxDurationMs) {
            continue;
        }
        if (($game['status'] ?? '') === 'finished' && empty($game['pool'])) {
            continue;
        }
        $games[$id]['status'] = 'finished';
        $games[$id]['endReason'] = 'timeout';
        $games[$id]['endedAt'] = $now;
        $games[$id]['updatedAt'] = $now;
        $games[$id]['pool'] = [];
    }
    return $games;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $games = apply_game_timeouts(load_games($dataFile));
    $games = prune_old_games($games);
    save_games($dataFile, $games);
    echo json_encode([
        'games' => $games,
        'serverTime' => (int)(microtime(true) * 1000),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $body = file_get_contents('php://input');
    $payload = json_decode($body ?: '', true);
    if (!is_array($payload) || !isset($payload['games']) || !is_array($payload['games'])) {
        http_response_code(400);
        echo json_encode(['error' => 'INVALID_PAYLOAD']);
        exit;
    }

    $existing = load_games($dataFile);
    $merged = merge_games($existing, $payload['games']);
    $merged = apply_game_timeouts($merged);
    $merged = prune_old_games($merged);

    if (!save_games($dataFile, $merged)) {
        http_response_code(500);
        echo json_encode(['error' => 'SAVE_FAILED']);
        exit;
    }

    echo json_encode([
        'ok' => true,
        'games' => $merged,
        'serverTime' => (int)(microtime(true) * 1000),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'METHOD_NOT_ALLOWED']);
