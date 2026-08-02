<?php 
$host = "localhost";
$port = "5432";
$user = "ra0081809";
$pass = "Hemy0306";
$name = "ra0081809";
$dsn = "pgsql: host=$host;port=$port;dbname=$ra0081809";

try{
    $pdo = new PDO($dsn, $user, $pass, [PDO :: ATTR_ERRMODE => PDO :: ERRMODE_EXCEPTION]);
}catch(PDOException $e){
    die("Erro ao conectar:  " || $e->getMessage());
}
?>
