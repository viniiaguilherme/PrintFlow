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
    empty($dados['id_impressora']) ||
    empty($dados['nome']) ||
    empty($dados['modelo']) || 
    empty($dados['material_padrao'])
){
    http_response_code(400);
    echo json_encode(["error" => "Preencha todos os campos obrigatórios."]);
    exit;
}
$idImpressora = (int) $dados['id_impressora'];
$nome = trim($dados['nome']);
$modelo = trim($dados['modelo']);
$material_padrao = trim($dados['material_padrao']);

try {
    $check = $pdo->prepare("SELECT id_impressora FROM public.impressoras WHERE id_impressora = :id_impressora");
    $check->execute([':id_impressora' => $idImpressora]);

    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "Impressora não encontrada."]);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE public.impressoras
        SET nome = :nome,
            modelo = :modelo,
            material_padrao = :material_padrao
        WHERE id_impressora = :id_impressora
    ");

    $resultado = $stmt->execute([
        ':nome' => $nome,
        ':modelo' => $modelo,
        ':material_padrao' => $material_padrao,
        ':id_impressora' => $idImpressora
    ]);

    if ($resultado) {
        http_response_code(200);
        echo json_encode(["message" => "Impressora atualizada com sucesso!"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao atualizar a impressora."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erro no banco de dados: " . $e->getMessage()]);
}