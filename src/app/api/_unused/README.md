# Unused API Endpoints

This directory contains API endpoints that are no longer actively used but are kept for reference.

## Moved APIs

### /api/users/[id]/language
- **Original Location**: `/api/users/[id]/language`
- **Current Location**: `/api/_unused/users-id-language`
- **Description**: User-specific language preference endpoint
- **Methods**: GET, PUT
- **Reason**: Replaced by `/api/user/language` for current user

## Notes

These endpoints are kept for reference but should not be used in production. They are excluded from the active API routes by being in the `_unused` directory.