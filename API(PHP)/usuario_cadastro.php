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

    if ($dados && !empty($dados['nome']) && !empty($dados['email']) && !empty($dados['senha'])) {
        $nome = trim($dados['nome']);
        $email = trim($dados['email']);
        $senha = password_hash($dados['senha'], PASSWORD_DEFAULT); // Hash seguro da senha
        $cargo = isset($dados['cargo']) ? trim($dados['cargo']) : '';

        try {
            // Verifica se o e-mail já está cadastrado
            $stmtCheck = $pdo->prepare("SELECT id FROM public.usuarios WHERE email = :email");
            $stmtCheck->execute([':email' => $email]);
            if ($stmtCheck->fetch()) {
                http_response_code(400);
                echo json_encode(["error" => "E-mail já cadastrado!"]);
                exit;
            }

            // Insere novo usuário utilizando Prepared Statement
            $stmt = $pdo->prepare("INSERT INTO public.usuarios (nome, email, senha, cargo, status) VALUES (:nome, :email, :senha, :cargo, 'Ativo')");
            $resultado = $stmt->execute([
                ':nome' => $nome,
                ':email' => $email,
                ':senha' => $senha,
                ':cargo' => $cargo
            ]);

            if ($resultado) {
                http_response_code(200);
                echo json_encode(["message" => "Usuário cadastrado com sucesso!"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Erro ao cadastrar o usuário."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Erro no banco de dados: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Preencha todos os campos obrigatórios."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Método não permitido."]);
}
?>

