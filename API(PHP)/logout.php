<?php
include 'db.php';
session_start();
session_unset();
$_SESSION = array();
session_destroy();
header("Location: login.html");
exit;
?>