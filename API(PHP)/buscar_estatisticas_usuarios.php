<?php

include 'db.php';

$total_membros    = pg_query($conexao, "SELECT COUNT(*) FROM usuarios");
$ativos_agora     = pg_query($conexao, "SELECT COUNT(*) FROM usuarios WHERE status = 'Ativo'");
$total_impressoes = pg_query($conexao, "SELECT COUNT(*) FROM historico_impressoes");
$filamento_usado  = pg_query($conexao, "SELECT COALESCE(SUM(peso_g), 0) FROM historico_impressoes");

$dados = [
    "total_membros"      => pg_fetch_result($total_membros, 0, 0),
    "ativos_agora"       => pg_fetch_result($ativos_agora, 0, 0),
    "total_impressoes"   => pg_fetch_result($total_impressoes, 0, 0),
    "filamento_usado_kg" => round(pg_fetch_result($filamento_usado, 0, 0) / 1000, 1)
];

echo json_encode($dados);

?>