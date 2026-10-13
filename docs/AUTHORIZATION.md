STATUS: partial
SOURCE: ../python/cl1_neural_lab/auth.py; ../database/auth_schema.sql
API: ../src/client/authClient.ts
TESTS: ../python/tests/test_auth.py
BACK: ./DOCUMENTATION-MANIFEST.md
NEXT: ./SANDBOX-VALIDATION.md

# Authentication and Authorization

The identity layer provides registration, login, logout, sessions, roles, permissions and administration contracts.

## Roles
- user: profile and read access.
- researcher: virtual experiments, cluster management, and virtual stimulation requests.
- admin: user/role administration and system configuration.

These application roles do not grant physical-hardware authority.

## Security
Passwords are never stored in plaintext. The reference service uses salted PBKDF2-HMAC-SHA256. Production deployment should use TLS, protected session cookies or equivalent secure tokens, CSRF protection where cookies are used, rate limiting, abuse controls, audit logging, and a secret manager. Authorization must be enforced server-side.

## Database
Use database/auth_schema.sql. It separates users, roles, permissions, assignments and sessions.

## API contract
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
GET /api/admin/users
PATCH /api/admin/users/:id
POST /api/admin/users/:id/roles
DELETE /api/admin/users/:id/sessions

The TypeScript client contract is src/client/authClient.ts. The Python memory service is for simulator/tests; the next server step is to bind these contracts to the existing Express/aiohttp API and MySQL repository without coupling identity to neural simulation.

## Hardware boundary
hardware.simulate_stimulation and cluster.manage apply to the virtual hardware model. A physical adapter remains a separate, reviewed capability behind the official CL API.