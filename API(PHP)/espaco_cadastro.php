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
    if ($dados && !empty($dados['nome']) && !empty($dados['responsavel'])) {
        $nome = trim($dados['nome']);
        $responsavel = trim($dados['responsavel']);

        try {
            // Verifica se o espaço já está cadastrado
            $stmtCheck = $pdo->prepare("SELECT id FROM public.espacos WHERE nome = :nome");
            $stmtCheck->execute([':nome' => $nome]);
            if ($stmtCheck->fetch()) {
                http_response_code(400);
                echo json_encode(["error" => "Espaço já cadastrado!"]);
                exit;
            }

            // Insere novo espaço utilizando Prepared Statement
            $stmt = $pdo->prepare("INSERT INTO public.espacos (nome, responsavel, status) VALUES (:nome, :responsavel, 'Ativo')");
            $resultado = $stmt->execute([
                ':nome' => $nome,
                ':responsavel' => $responsavel
            ]);

            if ($resultado) {
                http_response_code(200);
                echo json_encode(["message" => "Espaço cadastrado com sucesso!"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Erro ao cadastrar o espaço."]);
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
