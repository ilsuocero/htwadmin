export const generateUniqueNumber = () => {
    const timestamp = Date.now(); // Get the current timestamp in milliseconds
    const randomNumber = Math.floor(Math.random() * 1000000); // Generate a random number between 0 and 999999

    // Concatenate the timestamp and random number to create a unique number
    const uniqueNumber = parseInt(`${timestamp}${randomNumber}`);

    return uniqueNumber;
}