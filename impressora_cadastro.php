<?php
include 'db.php';
if ($_POST) {
    $nome = $_POST['nome'];
    $modelo = $_POST['modelo'];
    $material_padrao = $_POST['material_padrao'];


    $sql = "INSERT INTO public.impressoras
            (nome, modelo, material_padrao, status)
            VALUES
            ('$nome', '$modelo', '$material_padrao', 'Ativo')";
    $resultado = pg_query($conn, $sql);


    if ($resultado) {
        echo "Impressora cadastrada com sucesso!";
    } else {
        echo "Erro ao cadastrar: " . pg_last_error($conn);
    }
}
?>
