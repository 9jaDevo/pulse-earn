# PulseEarn API Documentation

This directory contains the Postman collection and environment files for the PulseEarn API. These files can be imported into Postman to explore and test the API endpoints.

## Files

- `postman_collection.json`: Contains all API endpoints organized by category
- `postman_environment.json`: Contains environment variables used by the collection

## Getting Started

### Importing into Postman

1. Download [Postman](https://www.postman.com/downloads/) if you don't have it installed
2. Open Postman
3. Click on "Import" in the top left corner
4. Select "File" and choose the `postman_collection.json` file
5. Repeat the process for the `postman_environment.json` file

### Setting Up Environment Variables

1. In Postman, click on the environment dropdown in the top right corner
2. Select "PulseEarn API Environment"
3. Update the following variables:
   - `SUPABASE_URL`: Your Supabase project URL (e.g., https://abcdefg.supabase.co)
   - `SUPABASE_ANON_KEY`: Your Supabase public 'anon' key

### Authentication

1. Use the "Sign Up" request in the Auth folder to create a new user, or "Sign In" to authenticate an existing user
2. The "Sign In" request has a script that automatically sets the `AUTH_TOKEN` and `USER_ID` variables upon successful login
3. These variables will be used for all subsequent authenticated requests

## API Structure

The API is organized into the following categories:

- **Auth**: User authentication (sign up, sign in, sign out)
- **Profiles**: User profile management
- **Polls**: Poll creation, voting, and comments
- **Rewards**: Daily rewards, trivia games, and reward store
- **Badges**: Achievement badges
- **Moderation**: Content moderation and reporting
- **Ambassador Program**: Referral system and ambassador management
- **Settings**: Application settings

## Mobile App Integration

When integrating with a mobile app:

1. Store the authentication token securely using the platform's secure storage
2. Include the token in the `Authorization` header for all authenticated requests
3. Implement token refresh logic to handle expired tokens
4. Use appropriate error handling for network issues and API errors

## Security Considerations

- Never store the `SUPABASE_ANON_KEY` in client-side code; it should be kept server-side
- Implement proper error handling and validation in your mobile app
- Follow platform-specific security best practices for storing sensitive data

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Postman Learning Center](https://learning.postman.com/docs/getting-started/introduction/)