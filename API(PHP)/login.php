<?php
session_start();
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
      $email = trim($_POST['email']);
      $senha = trim($_POST['senha']);

    if (!empty($email) && !empty($senha)) {
        // Prepara a query para evitar SQL Injection
        $stmt = $pdo->prepare("SELECT * FROM public.usuarios WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Verifica se o usuário existe e se a senha bate com o hash
        if ($user && password_verify($senha, $user['senha'])) {
            // Login bem-sucedido: inicia a sessão
            $_SESSION['usuario_id'] = $user['id'];
            $_SESSION['usuario_nome'] = $user['nome'];
            $_SESSION['usuario_email'] = $user['email'];
            $_SESSION['usuario_cargo'] = $user['cargo'];
            
            $_SESSION['usuario_logado'] = true;
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