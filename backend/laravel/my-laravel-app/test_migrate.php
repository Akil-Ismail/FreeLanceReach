<?php
// Test running artisan programmatically
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$status = $kernel->call('migrate:fresh', ['--seed' => true]);
echo "Exit code: $status\n";
echo $kernel->output();
