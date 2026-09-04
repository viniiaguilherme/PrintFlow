<?php

include 'db.php';

$impressoes = pg_query($conexao, "SELECT COUNT(*) FROM historico_impressoes");
$espacos = pg_query($conexao, "SELECT COUNT(*) FROM espacos");
$impressoras = pg_query($conexao, "SELECT COUNT(*) FROM impressoras");
$usuarios = pg_query($conexao, "SELECT COUNT(*) FROM usuarios");

$dados = [
    "impressoes_totais" => pg_fetch_result($impressoes, 0, 0),
    "espacos" => pg_fetch_result($espacos, 0, 0),
    "impressoras_cadastradas" => pg_fetch_result($impressoras, 0, 0),
    "usuarios_cadastrados" => pg_fetch_result($usuarios, 0, 0)
];

echo json_encode($dados);

?>