<?php
session_start();
require 'conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
      $usuario = trim($_POST['usuario']);
      $senha = trim($_POST['senha']);

    if (!empty($usuario) && !empty($senha)) {
        // Prepara a query para evitar SQL Injection
        $stmt = $PDO->prepare("SELECT id, usuario, senha FROM usuarios WHERE usuario = :usuario");
        $stmt->execute(['usuario' => $usuario]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Verifica se o usuário existe e se a senha bate com o hash
        if ($user && password_verify($senha, $user['senha'])) {
            // Login bem-sucedido: inicia a sessão
            $_SESSION['usuario_id'] = $user['id'];
            $_SESSION['usuario_nome'] = $user['usuario'];
            
            header("Location: fila.php");
            exit;
        } else {
            $erro = "Usuário ou senha incorretos.";
        }
    } else {
        $erro = "Preencha todos os campos.";
    }
}
    ?>