<?php
include 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método não permitido."]);
    exit;
}

$json = file_get_contents('php://input');
$dados = json_decode($json, true);

if (!is_array($dados) && !empty($_POST)) {
    $dados = $_POST;
}

if (
    !is_array($dados) ||
    empty($dados['id_usuario']) ||
    empty($dados['nome']) ||
    empty($dados['cargo']) || 
    empty($dados['email'])
) {
    http_response_code(400);
    echo json_encode(["error" => "Preencha todos os campos obrigatórios."]);
    exit;
}

$idUsuario = (int) $dados['id_usuario'];
$nome = trim($dados['nome']);
$email = trim($dados['email']);
$cargo = isset($dados['cargo']) && $dados['cargo'] !== '' ? trim($dados['cargo']) : null;

try {
    $check = $pdo->prepare("SELECT id_usuario FROM public.usuarios WHERE id_usuario = :id_usuario");
    $check->execute([':id_usuario' => $idUsuario]);

    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "Usuário não encontrado."]);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE public.usuarios
        SET nome = :nome,
            email = :email,
            cargo = :cargo
        WHERE id_usuario = :id_usuario
    ");

    $resultado = $stmt->execute([
        ':nome' => $nome,
        ':email' => $email,
        ':cargo' => $cargo,
        ':id_usuario' => $idUsuario
    ]);

    if ($resultado) {
        http_response_code(200);
        echo json_encode(["message" => "Usuário atualizado com sucesso!"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao atualizar o usuário."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erro no banco de dados: " . $e->getMessage()]);
}