# Quick Start Guide - Freelance Reach Backend

## What Was Created

✅ **Migration** - Users table with company and freelancer fields  
✅ **Model** - User model with role-based methods  
✅ **Factory** - User factory with company() and freelancer() states  
✅ **Seeders** - UserSeeder and DatabaseSeeder  
✅ **Validation** - StoreCompanyRequest, StoreFreelancerRequest, UpdateUserRequest  
✅ **Controller** - UserController with all CRUD operations  
✅ **Routes** - API routes configured  
✅ **Tests** - 7 comprehensive test cases

## Quick Setup (3 Steps)

### 1. Create Database

- Open XAMPP Control Panel
- Start MySQL
- Open phpMyAdmin (http://localhost/phpmyadmin)
- Create database: `freelance_reach`

### 2. Run Setup Commands

```bash
cd backend/laravel/my-laravel-app

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database (optional - creates test data)
php artisan db:seed

# Start server
php artisan serve
```

### 3. Test in Postman

**Register Company:**  
POST `http://localhost:8000/api/register/company`

```json
{
  "company_name": "Acme Corporation",
  "contact_first_name": "Jane",
  "contact_last_name": "Smith",
  "work_email": "contact@company.com",
  "email": "jane@acme.com",
  "phone_number": "+1 (555) 000-0000",
  "company_size": "11-50",
  "industry": "Technology",
  "company_description": "We are looking for talented freelancers",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Register Freelancer:**  
POST `http://localhost:8000/api/register/freelancer`

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "you@example.com",
  "phone_number": "+1 (555) 000-0000",
  "freelance_category": "Web Development",
  "professional_bio": "Experienced web developer with 5+ years building modern applications",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Get All Users:**  
GET `http://localhost:8000/api/users`

**Get Companies:**  
GET `http://localhost:8000/api/users/role/company`

**Get Freelancers:**  
GET `http://localhost:8000/api/users/role/freelancer`

## Run Tests

```bash
php artisan test
```

## Files Created/Modified

```
backend/laravel/my-laravel-app/
├── app/
│   ├── Models/
│   │   └── User.php (✅ Updated)
│   └── Http/
│       ├── Controllers/
│       │   └── UserController.php (✅ New)
│       └── Requests/
│           ├── StoreCompanyRequest.php (✅ New)
│           ├── StoreFreelancerRequest.php (✅ New)
│           └── UpdateUserRequest.php (✅ New)
├── database/
│   ├── migrations/
│   │   └── create_users_table.php (✅ Updated)
│   ├── factories/
│   │   └── UserFactory.php (✅ Updated)
│   └── seeders/
│       ├── UserSeeder.php (✅ New)
│       └── DatabaseSeeder.php (✅ Updated)
├── routes/
│   └── api.php (✅ Updated)
├── tests/
│   └── Feature/
│       └── UserRegistrationTest.php (✅ New)
├── .env (✅ Updated - Database config)
└── API_DOCUMENTATION.md (✅ New)
```

## Need Help?

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference and all Postman test cases.
