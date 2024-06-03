
const API_KEY = process.env.EXPO_PUBLIC_API_KEY; //put your key here.
//this endpoint will tell Google to use the Vision API. We are passing in our key as well.
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
function generateBody(image, date) {
  const body = {
    contents:[
        {
          parts:[
            {text: `You are an Ai assistant whose job is to accurately let me know when to move my car throughout the whole year based on the parking restrictions. Context would be provided from the image I would upload
            Given the parking sign in the image and today's date, ${date}, when should I move my car to avoid a ticket? Provide only the day and time in this format: "EEEE, MMMM do, h:MMA"`},
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