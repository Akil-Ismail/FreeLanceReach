# Freelance Reach - Laravel Backend API

## Setup Instructions

### Prerequisites

- PHP >= 7.4
- Composer
- MySQL (via XAMPP)
- Postman (for API testing)

### Installation Steps

1. **Install Dependencies**

   ```bash
   cd backend/laravel/my-laravel-app
   composer install
   ```

2. **Configure Environment**
   - The `.env` file is already configured for XAMPP
   - Default database: `freelance_reach`
   - Default user: `root` (no password)

3. **Create Database in XAMPP**
   - Start XAMPP and open phpMyAdmin (http://localhost/phpmyadmin)
   - Create a new database named: `freelance_reach`

4. **Run Migrations**

   ```bash
   php artisan migrate
   ```

5. **Seed Database** (Optional - creates test data)

   ```bash
   php artisan db:seed
   ```

6. **Start Server**

   ```bash
   php artisan serve
   ```

   The API will be available at: `http://localhost:8000`

7. **Run Tests**
   ```bash
   php artisan test
   ```

## API Endpoints

### User Management

| Method | Endpoint                   | Description                            |
| ------ | -------------------------- | -------------------------------------- |
| GET    | `/api/users`               | Get all users                          |
| GET    | `/api/users/role/{role}`   | Get users by role (company/freelancer) |
| GET    | `/api/users/{id}`          | Get single user                        |
| POST   | `/api/register/company`    | Register a company                     |
| POST   | `/api/register/freelancer` | Register a freelancer                  |
| PUT    | `/api/users/{id}`          | Update user                            |
| DELETE | `/api/users/{id}`          | Delete user                            |

## Postman Test Cases

### 1. Register Company

**POST** `http://localhost:8000/api/register/company`

**Body (JSON):**

```json
{
  "company_name": "Acme Corporation",
  "contact_first_name": "Jane",
  "contact_last_name": "Smith",
  "work_email": "contact@company.com",
  "email": "jane@acme.com",
  "phone_number": "+1 (555) 000-0000",
  "company_website": "https://www.company.com",
  "company_size": "11-50",
  "industry": "Technology",
  "company_description": "We are looking for talented freelancers to join our team and help us build amazing products.",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Expected Response (201):**

```json
{
  "message": "Company registered successfully",
  "user": {
    "role": "company",
    "email": "jane@acme.com",
    "phone_number": "+1 (555) 000-0000",
    "company_name": "Acme Corporation",
    "contact_first_name": "Jane",
    "contact_last_name": "Smith",
    "work_email": "contact@company.com",
    "company_website": "https://www.company.com",
    "company_size": "11-50",
    "industry": "Technology",
    "company_description": "We are looking for talented freelancers...",
    "updated_at": "2026-02-25T10:00:00.000000Z",
    "created_at": "2026-02-25T10:00:00.000000Z",
    "id": 1
  }
}
```

### 2. Register Freelancer

**POST** `http://localhost:8000/api/register/freelancer`

**Body (JSON):**

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "you@example.com",
  "phone_number": "+1 (555) 000-0000",
  "freelance_category": "Web Development",
  "professional_bio": "I am an experienced web developer with over 5 years of experience building modern web applications using React, Node.js, and Laravel.",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Expected Response (201):**

```json
{
  "message": "Freelancer registered successfully",
  "user": {
    "role": "freelancer",
    "email": "you@example.com",
    "phone_number": "+1 (555) 000-0000",
    "first_name": "John",
    "last_name": "Doe",
    "freelance_category": "Web Development",
    "professional_bio": "I am an experienced web developer...",
    "updated_at": "2026-02-25T10:00:00.000000Z",
    "created_at": "2026-02-25T10:00:00.000000Z",
    "id": 2
  }
}
```

### 3. Register Freelancer with CV Upload

**POST** `http://localhost:8000/api/register/freelancer`

**Body (form-data):**

- `first_name`: John
- `last_name`: Doe
- `email`: john@example.com
- `phone_number`: +1 (555) 000-0000
- `freelance_category`: Web Development
- `professional_bio`: I am an experienced web developer with over 5 years of experience...
- `cv`: [Upload PDF/DOC/DOCX file]
- `password`: password123
- `password_confirmation`: password123

### 4. Get All Users

**GET** `http://localhost:8000/api/users`

**Expected Response (200):**

```json
[
    {
        "id": 1,
        "role": "company",
        "email": "jane@acme.com",
        "company_name": "Acme Corporation",
        ...
    },
    {
        "id": 2,
        "role": "freelancer",
        "email": "you@example.com",
        "first_name": "John",
        ...
    }
]
```

### 5. Get Companies Only

**GET** `http://localhost:8000/api/users/role/company`

**Expected Response (200):**

```json
[
    {
        "id": 1,
        "role": "company",
        "email": "jane@acme.com",
        "company_name": "Acme Corporation",
        ...
    }
]
```

### 6. Get Freelancers Only

**GET** `http://localhost:8000/api/users/role/freelancer`

**Expected Response (200):**

```json
[
    {
        "id": 2,
        "role": "freelancer",
        "email": "you@example.com",
        "first_name": "John",
        ...
    }
]
```

### 7. Get Single User

**GET** `http://localhost:8000/api/users/1`

**Expected Response (200):**

```json
{
    "id": 1,
    "role": "company",
    "email": "jane@acme.com",
    "company_name": "Acme Corporation",
    ...
}
```

### 8. Update User

**PUT** `http://localhost:8000/api/users/1`

**Body (JSON):**

```json
{
  "company_name": "Updated Company Name",
  "company_description": "Updated description for our company with more details."
}
```

**Expected Response (200):**

```json
{
    "message": "User updated successfully",
    "user": {
        "id": 1,
        "role": "company",
        "company_name": "Updated Company Name",
        ...
    }
}
```

### 9. Delete User

**DELETE** `http://localhost:8000/api/users/1`

**Expected Response (200):**

```json
{
  "message": "User deleted successfully"
}
```

### 10. Test Validation Errors

**POST** `http://localhost:8000/api/register/company`

**Body (JSON - Missing required fields):**

```json
{
  "company_name": "Acme Corporation"
}
```

**Expected Response (422):**

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "contact_first_name": ["The contact first name field is required."],
    "contact_last_name": ["The contact last name field is required."],
    "work_email": ["The work email field is required."],
    "email": ["The email field is required."],
    "password": ["The password field is required."]
  }
}
```

## Test Users (After Seeding)

The seeder creates the following test users:

| Email               | Password    | Role       | Description             |
| ------------------- | ----------- | ---------- | ----------------------- |
| company@test.com    | password123 | Company    | Test company account    |
| freelancer@test.com | password123 | Freelancer | Test freelancer account |

Plus 5 random companies and 10 random freelancers.

## Database Schema

### Users Table

- `id` - Primary key
- `role` - Enum: 'company' or 'freelancer'
- `email` - Unique email
- `password` - Hashed password
- `phone_number` - Contact phone

#### Company Fields (nullable for freelancers)

- `company_name`
- `contact_first_name`
- `contact_last_name`
- `work_email`
- `company_website`
- `company_size`
- `industry`
- `company_description`

#### Freelancer Fields (nullable for companies)

- `first_name`
- `last_name`
- `freelance_category`
- `professional_bio`
- `cv_path`

## Testing

Run all tests:

```bash
php artisan test
```

Run specific test:

```bash
php artisan test --filter=test_company_can_register
```

## Troubleshooting

### Database Connection Issues

- Make sure XAMPP MySQL is running
- Verify database `freelance_reach` exists in phpMyAdmin
- Check `.env` file has correct credentials

### Migration Errors

```bash
# Reset database and re-run migrations
php artisan migrate:fresh --seed
```

### Clear Cache

```bash
php artisan config:clear
php artisan cache:clear
```
