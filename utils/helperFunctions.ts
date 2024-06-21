
const API_KEY = process.env.EXPO_PUBLIC_API_KEY; //put your key here.
//this endpoint will tell Google to use the Vision API. We are passing in our key as well.
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
function generateBody(image, date) {
  const body = {
    contents:[
        {
          parts:[
            {text: `You are an AI assistant whose job is to accurately let me know when to move my car throughout the whole year based on the parking restrictions. Context will be provided from the image I upload.

            Given the parking sign in the image and today's date, today's date being ${date}, when next should I move my car to avoid a ticket? Consider the following details in your answer:

            
            1. Identify the days and times when parking is restricted from the parking sign in the image.
            2. If today is one of the restricted days and it is already past the restricted time, provide the next upcoming restricted day and time.
            3. If today is not one of the restricted days, provide the next upcoming restricted day and time.
            4. Provide the next day and time in the format: "EEEE, MMMM do, h:mma".

            Please Provide only the next day and time in this format: "EEEE, MMMM do, h:mma

            
            Make sure to accurately interpret the parking sign and calculate the next instance when the car needs to be moved to avoid a ticket.
            `},
            {
              inline_data: {
                mime_type:"image/jpeg",
                data: image
              }
            }
          ]
        }
      ]
  };
  return body;
}
async function callGoogleVisionAsync(image, date) {
    const body = generateBody(image, date); //pass in our image for the payload
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    console.log("result",result);
     const detectedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    return detectedText
    ? detectedText
    : { text: "This image doesn't contain any text!" };
  }
  export default callGoogleVisionAsync;