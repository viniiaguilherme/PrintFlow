<?php 
$host = "localhost";
$port = "5432";
$user = "ra0081809";
$pass = "Hemy0306";
$name = "ra0081809";
$dsn = "pgsql:host=$host;port=$port;dbname=$name";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(500);
    echo json_encode(["sucesso" => false, "mensagem" => "Erro ao conectar ao banco de dados: " . $e->getMessage()]);
    exit;
}
?>
