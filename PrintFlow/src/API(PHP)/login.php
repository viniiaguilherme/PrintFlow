<?php
require_once ("db.php");
session_start();

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $dados = json_decode($json, true);

    $loginInput = trim($dados['email'] ?? $dados['usuario'] ?? '');
    $senha = trim($dados['senha'] ?? '');

    if (empty($loginInput) || empty($senha)) {
        http_response_code(400);
        echo json_encode(["sucesso" => false, "mensagem" => "E-mail/usuário e senha são obrigatórios."]);
        exit;
    }

    try {
        $sql = "SELECT * FROM usuarios WHERE email = :login OR usuario = :login LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':login' => $loginInput]);
        $user = $stmt->fetch();

        if ($user) {
            $passwordValid = password_verify($senha, $user['senha']) || ($senha === $user['senha']);
            if ($passwordValid) {
                $_SESSION['usuario_id'] = $user['id'];
                $_SESSION['usuario_nome'] = $user['usuario'] ?? $user['email'];

                echo json_encode([
                    "sucesso" => true,
                    "mensagem" => "Login realizado com sucesso!",
                    "usuario_id" => $user['id']
                ]);
                exit;
            }
        }

        http_response_code(401);
        echo json_encode(["sucesso" => false, "mensagem" => "Usuário/E-mail ou senha incorretos."]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["sucesso" => false, "mensagem" => "Erro de servidor: " . $e->getMessage()]);
        exit;
    }
} else {
    http_response_code(405);
    echo json_encode(["sucesso" => false, "mensagem" => "Método não permitido."]);
    exit;
}
?>