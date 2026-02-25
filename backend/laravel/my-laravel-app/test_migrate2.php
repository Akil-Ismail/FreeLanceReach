<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require __DIR__ . '/vendor/autoload.php';

try {
    $app = require_once __DIR__ . '/bootstrap/app.php';
    echo "App loaded\n";

    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    echo "Kernel created\n";

    $status = $kernel->call('migrate:fresh', ['--seed' => true, '--force' => true]);
    echo "Exit code: $status\n";
    echo $kernel->output();
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo $e->getTraceAsString() . "\n";
}
