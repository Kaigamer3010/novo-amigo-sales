FROM richarvey/nginx-php-fpm:latest

# Copia os arquivos do projeto para o container
COPY . /var/www/html

# Configurações obrigatórias para esta imagem rodar o Laravel corretamente
ENV WEBROOT /var/www/html/public
ENV COMPOSER_ALLOW_SUPERUSER 1

# Define as variáveis de ambiente necessárias para o deploy estático
ENV LARA_APP_ENV=production
ENV APP_ENV=production
ENV APP_DEBUG=false

# Instala as dependências do Composer sem pacotes de desenvolvimento
RUN composer install --no-dev --optimize-autoloader

# Ajusta as permissões das pastas storage e bootstrap/cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# O Render exige que a aplicação escute na porta 80 por padrão usando esta imagem
EXPOSE 80