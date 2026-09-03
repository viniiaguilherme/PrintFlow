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
    empty($dados['id_espaco']) ||
    empty($dados['nome']) ||
    empty($dados['responsavel'])
) {
    http_response_code(400);
    echo json_encode(["error" => "Preencha todos os campos obrigatórios."]);
    exit;
}

$idEspaco = (int) $dados['id_espaco'];
$nome = trim($dados['nome']);
$responsavel = trim($dados['responsavel']);

try {
    $check = $pdo->prepare("SELECT id_espaco FROM public.espacos WHERE id_espaco = :id_espaco");
    $check->execute([':id_espaco' => $idEspaco]);

    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "Espaço não encontrado."]);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE public.espacos
        SET nome = :nome,
            responsavel = :responsavel
        WHERE id_espaco = :id_espaco
    ");

    $resultado = $stmt->execute([
        ':nome' => $nome,
        ':responsavel' => $responsavel,
        ':id_espaco' => $idEspaco
    ]);

    if ($resultado) {
        http_response_code(200);
        echo json_encode(["message" => "Espaço atualizado com sucesso!"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao atualizar o espaço."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erro no banco de dados: " . $e->getMessage()]);
}