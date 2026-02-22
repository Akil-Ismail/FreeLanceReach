# FreelanceReach Laravel Backend

## Setup

1. Install Laravel via Composer:

```bash
composer create-project laravel/laravel .
```

2. Configure your `.env` file with database credentials

3. Generate application key:

```bash
php artisan key:generate
```

4. Run migrations:

```bash
php artisan migrate
```

5. Start the development server:

```bash
php artisan serve --port=8001
```

The API will be available at `http://localhost:8001`

## Project Structure

Laravel follows the standard MVC architecture.
