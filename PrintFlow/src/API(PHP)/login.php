<?php
require_once ("conexao.php");
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $dados = json_decode($json, true);

    

    $usuario = trim($dados['usuario']);
    $senha = trim($dados['senha']);


    $sql = "SELECT * FROM usuarios WHERE usuario = $1";
    $resultado = pg_query_params($conn, $sql, array($usuario));
    
    if(pg_num_rows($resultado) > 0) {
        $user = pg_fetch_assoc($resultado);
        if (password_verify($senha, $user['senha'])) {
            $_SESSION['usuario_id'] = $user['id'];
            $_SESSION['usuario_nome'] = $user['usuario'];
            
            echo json_encode(["message" => "Login realizado com sucesso!", "usuario_id" => $user['id']]);
            exit;
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Usuário ou senha incorretos."]);
        }
    } else {
        echo json_encode(["error" => "Usuário ou senha incorretos."]);
    }
}
?>