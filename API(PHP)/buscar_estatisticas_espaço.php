<?php

include 'db.php';

$espaco_id = $_GET['espaco_id'] ?? null;

if (!$espaco_id) {
    echo json_encode([
        "erro" => "ID do espaço não informado"
    ]);
    exit;
}

$sql = "SELECT 
            impressoras,
            filas,
            alertas,
            usuarios
        FROM estatisticas_espaco
        WHERE espaco_id = $1";

$resultado = pg_query_params($conexao, $sql, [$espaco_id]);

if (!$resultado) {
    echo json_encode([
        "erro" => "Erro ao consultar as estatísticas"
    ]);
    exit;
}

$dados = pg_fetch_assoc($resultado);

if (!$dados) {
    echo json_encode([
        "erro" => "Espaço não encontrado"
    ]);
    exit;
}

echo json_encode($dados);

?>