<?php
session_start();

if (isset($_SESSION['usuario_logado']) && $_SESSION['usuario_logado'] === true) {
    
    echo json_encode([
        'logado' => true,
        'usuario_id' => $_SESSION['usuario_id'],
        'usuario_nome' => $_SESSION['usuario_nome'],
        'usuario_email' => $_SESSION['usuario_email']
    ]);
} else {
    http_response_code(401);
    echo json_encode(['logado' => false]);
}