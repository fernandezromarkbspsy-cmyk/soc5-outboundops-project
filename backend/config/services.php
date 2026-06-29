<?php

return [

    'admin_emails' => array_values(array_filter(array_map('trim', explode(',', env('ADMIN_EMAILS', 'romark.fernandez@spxexpress.com'))))),
    'supabase' => [
        'url' => env('SUPABASE_URL'),
        'anon_key' => env('SUPABASE_PUBLISHABLE_KEY') ?: env('SUPABASE_ANON_KEY'),
        'service_key' => env('SUPABASE_SERVICE_ROLE_KEY'),
    ],
    'backroom' => [
        'initial_password' => env('BACKROOM_INITIAL_PASSWORD'),
    ],
];
