<?php 
include 'db.php';
    $sql = "SELECT * FROM historico_impressoes";
    $resultado = pg_query($conexao, $sql);
    $dados = [];
        while($linha = pg_fetch_assoc($resultado)){
          $dados[] = $linha;
}
echo json_encode($dados);
?>
