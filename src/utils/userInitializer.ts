import interviewService from '../firebase/services';

export const initializeUserData = async (uid: string, interviewsLeft: number = 10) => {
  try {
    await interviewService.createOrUpdateUser(uid, {
      interviewsLeft,
      lastUpdated: new Date(),
      createdAt: new Date()
    });
    console.log(`User ${uid} initialized with ${interviewsLeft} interviews`);
    return true;
  } catch (error) {
    console.error('Error initializing user data:', error);
    return false;
  }
};

export const getUserData = async (uid: string) => {
  try {
    const userData = await interviewService.getUserByUid(uid);
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

export const updateUserInterviewCount = async (uid: string, count: number) => {
  try {
    await interviewService.createOrUpdateUser(uid, {
      interviewsLeft: count,
      lastUpdated: new Date()
    });
    console.log(`Updated ${uid} to have ${count} interviews left`);
    return true;
  } catch (error) {
    console.error('Error updating user interview count:', error);
    return false;
  }
}; 