<?php

/**
 * Laravel Application Entry Point Proxy
 *
 * This file redirects all requests to the public/index.php
 * Used when the web server document root cannot be changed
 */

// Define the path to the public folder
$publicPath = __DIR__ . '/public';

// Check if the request is for a static file in the public directory
$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? ''
);

// If requesting a file that exists in public folder, serve it directly
if ($uri !== '/' && file_exists($publicPath . $uri)) {
    // Serve static files directly
    $file = $publicPath . $uri;
    $ext = pathinfo($file, PATHINFO_EXTENSION);

    $mimeTypes = [
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'xml' => 'application/xml',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'eot' => 'application/vnd.ms-fontobject',
    ];

    if (isset($mimeTypes[$ext])) {
        header('Content-Type: ' . $mimeTypes[$ext]);
    }

    readfile($file);
    exit;
}

// For all other requests, load Laravel
require_once $publicPath . '/index.php';
