FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json ./
COPY composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-interaction

FROM php:8.3-fpm-alpine
RUN apk add --no-cache libpq-dev oniguruma-dev \
 && docker-php-ext-install mbstring opcache pdo_pgsql \
 && apk del oniguruma-dev
WORKDIR /var/www/html
COPY --from=vendor /app/vendor ./vendor
COPY . .
RUN php artisan package:discover --ansi
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache
USER www-data
CMD ["php-fpm"]
