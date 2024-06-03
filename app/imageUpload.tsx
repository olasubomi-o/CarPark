import * as ImagePicker from 'expo-image-picker';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { StyleSheet, Alert } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Button, Image, View, Text, TouchableOpacity } from 'react-native';
import * as Calendar from 'expo-calendar';
import * as Location from 'expo-location';
import { parse } from 'date-fns';
import callGoogleVisionAsync from '@/utils/helperFunctions';

function ImageUploader() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [permission, requestCameraPermission] = useCameraPermissions();
  const [calStatus, requestCalendarPermission] = Calendar.useCalendarPermissions();
  const [remindStatus, requestReminderPermission] = Calendar.useRemindersPermissions();
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [status, setStatus] = useState({});

  const cameraRef = useRef(null);

  const today = new Date();
  const formattedDate = today.toString();

  const getLocation = async () => {
    let loStatus = await Location.requestForegroundPermissionsAsync();
    console.log("lostats", loStatus)
    setStatus(loStatus);
    if (loStatus.status !== 'granted') {
      Alert.alert("Permission to access location was denied. We need it so you can remember where you parked :)");
      loStatus = await Location.requestForegroundPermissionsAsync();
      setStatus(loStatus);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);
    // setLocation(location);

    console.log("Loc", location)

  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (reverseGeocode.length > 0) {
        let location = reverseGeocode[0];
        let formattedAddress = `${location.name}, ${location.street}, ${location.city}, ${location.region}, ${location.country}, ${location.postalCode}`;
        setAddress(formattedAddress);
      } else {
        setAddress('No address found');
      }
    } catch (error) {
      Alert.alert('Error in getting address');
      console.log('Error in getting address:', error);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      let photo = await cameraRef.current.takePictureAsync({ base64: true });
      setImage(photo);
        // Trigger location fetching after taking the picture
      // await remind(image?.base64, formattedDate);  // Create the reminder after taking the picture and fetching location
    }

    if(image !== null){
      await getLocation();
      await remind(image?.base64, formattedDate)
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setImage(result.assets[0]);
       console.log( formattedDate,"image")
       await getLocation();  
        // await remind(result.assets[0].base64, formattedDate); 
     
    }
  };

  const remind = async (image, formattedDate) => {
    let detText = await callGoogleVisionAsync(image, formattedDate)
    if (detText === "This image doesn't contain any text!") {
      Alert.alert("No text found", "The image doesn't contain any recognizable text.");
      return;
    }
     
     setText(detText)
     console.log("Textt", detText)
    const eventTitle = "Move Car - ParkCar App Reminder";
    let dateTimeString = detText; // This should come from your extracted text
    // Parse the date and time string
    const parsedDate = parse(dateTimeString, "EEEE, MMMM do, h:mma", new Date());

    if (calStatus?.granted && remindStatus?.granted) {
      let calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      if (calendars.length > 0) {
        let calendarId = calendars[0]?.id;

          console.log("Address -11", address)

          const eventDetails = {
            title: eventTitle,
            startDate: parsedDate,
            endDate: new Date(parsedDate.getTime() + 90 * 60 * 1000), // 1 hour 30 minutes event
            timeZone: "GMT",
            location: address, // Add your car location if available
            alarms: [
              {
                relativeOffset: -30, // 30 minutes before the start time
                method: Calendar.AlarmMethod.ALERT
              }
            ]
          };
  
          try {
            await Calendar.createEventAsync(calendarId, eventDetails);
            Alert.alert("Reminder Added", `Move your car by ${dateTimeString}. A reminder has been added to your calendar :)`);
            console.log("Event created successfully!", location, status);
          } catch (e) {
            console.log("Error creating event: ", e);
          }
        }

       
    } else {
      requestCalendarPermission();
      requestReminderPermission();
    }
  };

  useEffect(() => {
    requestCameraPermission();
    requestCalendarPermission();
    requestReminderPermission();
    async () => { await Location.requestForegroundPermissionsAsync(); }
  }, []);

  useEffect(() =>{

    if(address && image){
      remind(image?.base64, formattedDate)
    }

  },[address, image])

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>ParkCar</Text>
      <Text style={styles.instructions}>Simply take a picture of your street parking sign and never forget where you park!</Text>
      {image ? (
        <>
          <Image
            source={{ uri: image?.uri }}
            style={styles.image}
          />
          <Text style={styles.text}>{text}</Text>
        </>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing='back' ref={cameraRef}>
            <View style={styles.cameraButtonContainer}>
              <TouchableOpacity onPress={takePicture} style={styles.captureButton}></TouchableOpacity>
            </View>
          </CameraView>
        </View>
      )}
      <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
        <Text style={styles.uploadButtonText}>or Upload Image</Text>
      </TouchableOpacity>
      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0'
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  instructions: {
    fontSize: 16,
    color: '#333',
    marginBottom: 30,
    textAlign: 'center'
  },
  cameraContainer: {
    width: 300,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center'
  },
  camera: {
    width: 350,
    height: 400,
    justifyContent: 'flex-end'
  },
  cameraButtonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 60,
    height: 60,
    backgroundColor: 'red',
    borderRadius: 30,
    marginBottom: 20,
    borderWidth: 5,
    borderColor: 'white'
  },
  uploadButton: {
    backgroundColor: '#1E90FF',
    borderRadius: 10,
    padding: 15,
    marginTop: 30
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16
  },
  image: {
    width: 350,
    height: 400,
    resizeMode: "contain"
  },
  text: {
    color: '#333',
    padding: 10,
    fontSize: 16,
    textAlign: 'center'
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    fontSize: 14
  }
});

export default ImageUploader;
