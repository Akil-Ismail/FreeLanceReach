<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=freelance_reach', 'root', '');
    echo "DB Connected Successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
