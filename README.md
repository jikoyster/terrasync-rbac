# TerraSync RBAC Farmer Management

React + Vite + Supabase application organized using an MVC-style structure.

## Features

- Farmer-first login screen with **FARMER** and **ADMIN** tabs.
- Farmer authentication against `public.farmers` through a secure Supabase RPC.
- Admin authentication through Supabase Authentication.
- Admin route: `/admin/dashboard`
- Farmer route: `/profile`
- Admin farmer list with search, status filter, create, update and delete.
- Farmer names open a full profile page.
- Farmers can update only their own profile through a modal.
- Responsive layout closely follows the supplied TerraSync screenshot.
- Create and Update operations use modal forms.
- No blank-screen routing problem: `index.html`, Vite config, React root, and route fallbacks are included.

## 1. Install

```bash
npm install
npm run dev
```

## 2. Supabase setup

Run `supabase/schema.sql` in the Supabase SQL Editor.

The SQL creates:

- `public.farmers`
- `public.user_roles`
- RLS policies
- `public.authenticate_farmer(...)`
- `public.get_farmer_profile(...)`
- `public.set_updated_at()`

## 3. Create an admin

First create an admin account in Supabase Dashboard:

Authentication -> Users -> Add user

Then run:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do update set role = 'admin';
```

Replace the email with the actual admin account.

## 4. Farmer login

The farmer login accepts either:

- RSBSA number
- Farmer email

and the password stored for the farmer. The supplied table definition defaults new farmer passwords to the MD5 hash of `terrapass`.

For a real production deployment, migrate the farmer credentials to Supabase Auth instead of keeping passwords in `public.farmers`. The included RPCs deliberately prevent the password hash from being returned to the browser and perform password hashing inside PostgreSQL.

## 5. Important security note

Do not put a Supabase `service_role` key in this React application. Only the anon/public key belongs in the browser.

The farmer RPC is `SECURITY DEFINER` and returns only safe profile fields. RLS still protects direct table access.

## MVC-style organization

```text
src/
  controllers/
    authController.js
    farmerController.js
  models/
    supabaseClient.js
    authModel.js
    farmerModel.js
  views/
    App.jsx
    pages/
      LoginPage.jsx
      AdminDashboard.jsx
      FarmerProfile.jsx
      FarmerDetails.jsx
    components/
      Header.jsx
      AdminNav.jsx
      StatCard.jsx
      Modal.jsx
      FarmerForm.jsx
      FarmerTable.jsx
  styles/
    app.css
  main.jsx

supabase/
  schema.sql
```

## Farmer self-update security

The farmer Update modal asks for the current password. The `update_own_farmer_profile` SECURITY DEFINER RPC verifies that password before changing the profile and can optionally set a new password. This avoids granting anonymous users direct UPDATE access to the `farmers` table.
