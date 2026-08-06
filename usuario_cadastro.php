<?php
include 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $dados = json_decode($json, true);

    if($dados) {
        $nome = $dados['nome'];
        $email = $dados['email'];
        $senha = $dados['senha'];
        $cargo = $dados['cargo'];

        $sql = "INSERT INTO public.usuarios
                (nome, email, senha, cargo, status)
                VALUES
                ('$nome', '$email', '$senha', '$cargo', 'Ativo')";
        $resultado = pg_query($conn, $sql);

        if ($resultado) {
            http_response_code(200);
            echo json_encode(["message" => "Usuário cadastrado com sucesso!"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Erro ao cadastrar: " . pg_last_error($conn)]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Dados inválidos."]);
    } 
}
?>

