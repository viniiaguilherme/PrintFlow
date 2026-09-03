<?php
include 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Tenta obter os dados via JSON ou POST tradicional
    $json = file_get_contents('php://input');
    $dados = json_decode($json, true);


    if (!$dados && !empty($_POST)) {
        $dados = $_POST;
    }

    if ($dados && !empty($dados['nome']) && !empty($dados['modelo'])) {
        $nome = trim($dados['nome']);
        $modelo = trim($dados['modelo']);
        $material_padrao = trim($dados['material_padrao']);
    } else {
        $nome = trim($_POST['nome'] ?? '');
        $modelo = trim($_POST['modelo'] ?? '');
        $material_padrao = trim($_POST['material_padrao'] ?? '');
    }

    if (!empty($nome) && !empty($modelo)) {
        try {
            // Verifica se a impressora já está cadastrada
            $stmtCheck = $pdo->prepare("SELECT id FROM public.impressoras WHERE nome = :nome");
            $stmtCheck->execute([':nome' => $nome]);
            if ($stmtCheck->fetch()) {
                http_response_code(400);
                echo json_encode(["error" => "Impressora já cadastrada!"]);
                exit;
            }

            // Insere nova impressora utilizando Prepared Statement
            $stmt = $pdo->prepare("INSERT INTO public.impressoras (nome, modelo, material_padrao, status) VALUES (:nome, :modelo, :material_padrao, 'Ativo')");
            $resultado = $stmt->execute([
                ':nome' => $nome,
                ':modelo' => $modelo,
                ':material_padrao' => $material_padrao
            ]);

            if ($resultado) {
                http_response_code(200);
                echo json_encode(["message" => "Impressora cadastrada com sucesso!"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Erro ao cadastrar a impressora."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Erro no banco de dados: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Preencha todos os campos obrigatórios."]);
    }
}
?>
