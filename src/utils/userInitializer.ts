import interviewService from '../firebase/services';

export const initializeUserData = async (email: string, interviewsLeft: number = 10) => {
  try {
    await interviewService.createOrUpdateUser(email, {
      interviewsLeft,
      lastUpdated: new Date(),
      createdAt: new Date()
    });
    console.log(`User ${email} initialized with ${interviewsLeft} interviews`);
    return true;
  } catch (error) {
    console.error('Error initializing user data:', error);
    return false;
  }
};

export const getUserData = async (email: string) => {
  try {
    const userData = await interviewService.getUserByEmail(email);
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

export const updateUserInterviewCount = async (email: string, count: number) => {
  try {
    await interviewService.createOrUpdateUser(email, {
      interviewsLeft: count,
      lastUpdated: new Date()
    });
    console.log(`Updated ${email} to have ${count} interviews left`);
    return true;
  } catch (error) {
    console.error('Error updating user interview count:', error);
    return false;
  }
}; 