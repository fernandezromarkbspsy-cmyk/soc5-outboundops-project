<?php

return [
    'default' => env('DB_CONNECTION', 'pgsql'),
    'connections' => ['pgsql' => [
        'driver' => 'pgsql', 'host' => env('DB_HOST'), 'port' => env('DB_PORT', 5432),
        'database' => env('DB_DATABASE', 'postgres'), 'username' => env('DB_USERNAME'),
        'password' => env('DB_PASSWORD'), 'charset' => 'utf8', 'prefix' => '',
        'schema' => 'public', 'sslmode' => env('DB_SSLMODE', 'require'),
    ]],
];
