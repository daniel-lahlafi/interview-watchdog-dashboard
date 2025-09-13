# Interview Count Feature

This feature adds the ability to track and display the number of interviews a user has left. The interview count is stored in Firebase Firestore in the `users` collection, with the document ID being the user's email address.

## Features

### 1. Sidebar Display
- Shows the number of interviews left next to the "Create Interview" button
- Displays as a red badge with the count
- Updates in real-time when interviews are created

### 2. Create Interview Page
- Displays the current interview count in the header
- Shows a warning when no interviews are left
- Prevents creating interviews when count is 0
- Automatically decrements the count when an interview is created
- Updates the button text to show remaining interviews

### 3. Interviews Page
- Shows the interview count in the header next to the page title
- Displays as a blue badge with the count

### 4. Settings Page
- New "User Management" section
- Shows current interview count
- Allows manual adjustment of interview count (+/- buttons)
- Provides buttons to initialize user (10 interviews) or reset to 10
- Real-time updates when changes are made

## Technical Implementation

### Firebase Structure
```
users/
  {user-email}/
    interviewsLeft: number
    lastUpdated: timestamp
    createdAt: timestamp
```

### Key Components

1. **UserContext** (`src/contexts/UserContext.tsx`)
   - Manages user interview count state
   - Provides refresh functionality
   - Handles loading states

2. **Firebase Services** (`src/firebase/services.ts`)
   - `getUserByEmail()` - Fetch user data
   - `createOrUpdateUser()` - Create or update user document
   - `getUserInterviewCount()` - Get current interview count
   - `decrementUserInterviewCount()` - Decrement count when interview is created

3. **User Initializer** (`src/utils/userInitializer.ts`)
   - Utility functions for managing user data
   - Initialize new users with default interview count
   - Update interview counts

### Usage

1. **For New Users**: Use the "Initialize User" button in Settings to set up the user with 10 interviews
2. **For Existing Users**: The system will automatically fetch their current interview count
3. **Creating Interviews**: The count automatically decrements when interviews are created
4. **Manual Adjustment**: Use the +/- buttons in Settings to adjust the count

## Error Handling

- Graceful fallback to 0 interviews if user data is not found
- Loading states while fetching user data
- Error messages when operations fail
- Prevents creating interviews when count is 0

## Future Enhancements

- Add admin panel for managing all users' interview counts
- Implement subscription-based interview limits
- Add email notifications when running low on interviews
- Track interview usage history
- Add bulk operations for interview count management 