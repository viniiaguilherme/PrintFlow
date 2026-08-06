<?php
include 'db.php';
if ($_POST) {
    $nome = $_POST['nome'];
    $responsavel = $_POST['responsavel'];

    $sql = "INSERT INTO public.espacos
            (nome, responsavel, status)
            VALUES
            ('$nome', '$responsavel', 'Ativo')";
    $resultado = pg_query($conn, $sql);


    if ($resultado) {
        echo "Espaço cadastrado com sucesso!";
    } else {
        echo "Erro ao cadastrar: " . pg_last_error($conn);
    }
}
?>
