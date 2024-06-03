import * as ImagePicker from 'expo-image-picker';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { StyleSheet, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Image, View, Text, TouchableOpacity } from 'react-native';
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
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const cameraRef = useRef(null);

  const today = new Date();
  const formattedDate = today.toString();

  const requestLocationPermission = async () => {
    let loStatus = await Location.requestForegroundPermissionsAsync();
    if (loStatus.status !== 'granted') {
      Alert.alert("Permission to access location was denied. We need it so you can remember where you parked :)");
      return false;
    }
    return true;
  };

  const getLocation = async () => {
    setLocationLoading(true);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setLocationLoading(false);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    await getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);
    setLocationLoading(false);
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
      await getLocation();
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
      await getLocation();
    }
  };

  const remind = async (image, formattedDate) => {
    setLoading(true);
    let detText = await callGoogleVisionAsync(image, formattedDate);
    if (detText === "This image doesn't contain any text!") {
      setLoading(false);
      Alert.alert("No text found", "The image doesn't contain any recognizable text.");
      return;
    }

    setText(detText);
    const eventTitle = "Move Car - ParkCar App Reminder";
    let dateTimeString = detText; // This should come from your extracted text
    // Parse the date and time string
    const parsedDate = parse(dateTimeString, "EEEE, MMMM do, h:mma", new Date());

    if (calStatus?.granted && remindStatus?.granted) {
      let calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      if (calendars.length > 0) {
        let calendarId = calendars[0]?.id;

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
          setLoading(false);
          Alert.alert("Reminder Added", `Move your car by ${dateTimeString}. A reminder has been added to your calendar :)`);
          resetCameraView(); // Reset camera view
        } catch (e) {
          setLoading(false);
          console.log("Error creating event: ", e);
          Alert.alert('Error creating event', 'Could not create calendar event. Please try again.');
        }
      }
    } else {
      requestCalendarPermission();
      requestReminderPermission();
      setLoading(false);
    }
  };

  const resetCameraView = () => {
    setImage(null);
    setText('');
    setAddress('');
  };

  useEffect(() => {
    requestCameraPermission();
    requestCalendarPermission();
    requestReminderPermission();
  }, []);

  useEffect(() => {
    if (address && image) {
      remind(image?.base64, formattedDate);
    }
  }, [address, image]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>ParkCar</Text>
      <Text style={styles.instructions}>Simply take a picture of your street parking sign and never forget where you park!</Text>
      {loading || locationLoading ? (
        <ActivityIndicator size="large" color="#1E90FF" />
      ) : (
        <>
          {image ? (
            <>
              <Image source={{ uri: image?.uri }} style={styles.image} />
              <Text style={styles.text}>{text}</Text>
            </>
          ) : (
            <View style={styles.cameraContainer}>
              <CameraView style={styles.camera} facing='back' ref={cameraRef} />
            </View>
          )}
        </>
      )}
      <TouchableOpacity onPress={takePicture} style={styles.uploadButton}>
        <Text style={styles.uploadButtonText}>Take Picture</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
        <Text style={styles.uploadButtonText}>Upload Image</Text>
      </TouchableOpacity>
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
