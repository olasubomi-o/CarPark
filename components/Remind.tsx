import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Button, Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

export default function Remind() {

  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        console.log('Here are all your calendars:');
        console.log({ calendars });
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Calendar Module Example</Text>
      {/* <Button title="Create a new calendar" onPress={createCalendar} /> */}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});