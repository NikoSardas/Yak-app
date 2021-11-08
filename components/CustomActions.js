import React from 'react'
import PropTypes from 'prop-types'

// Import ui components
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

// Import custom actions components
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'

// Import firebase
import firebase from 'firebase'

export default class CustomActions extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      location: null,
    }
  }

  // method for using a photo from the media library
  pickImage = async () => {
    // get library permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    try {
      if (status === 'granted') {
        //get image from library
        let libraryImage = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        }).catch((error) => console.log(error.message))

        //upload image to db, then send to chat
        if (!libraryImage.cancelled) {
          const imageUrl = await this.uploadImage(libraryImage.uri)
          this.props.onSend({ image: imageUrl })
        }
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  // method for using camera to take a photo
  takeImage = async () => {
    // get camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync()

    try {
      if (status === 'granted') {
        //load camera and wait for photo to be taken
        let cameraImage = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
        }).catch((error) => console.log(error.message))

        //upload image to db, then send to chat
        if (!cameraImage.cancelled) {
          const imageUrl = await this.uploadImage(cameraImage.uri)
          this.props.onSend({ image: imageUrl })
        }
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  // upload image to db
  uploadImage = async (imageURI) => {
    // create new blob from the image parameter
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.onload = function () {
        resolve(xhr.response)
      }
      xhr.onerror = function (e) {
        console.log(e)
        reject(new TypeError('Network request failed'))
      }
      xhr.responseType = 'blob'
      xhr.open('GET', imageURI, true)
      xhr.send(null)
    })

    // create image reference on the Firebase db
    const ref = firebase.storage().ref().child(`images/${new Date()}`)

    // upload blob into reference
    const snapshot = await ref.put(blob)

    // remove blob locally
    blob.close()

    // return image ref url from db
    return await snapshot.ref.getDownloadURL()
  }

  getLocation = async () => {
    // get location permission
    const { status } = await Location.requestForegroundPermissionsAsync()

    try {
      if (status === 'granted') {
        //get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch((error) => {
          console.error(error)
        })

        if (location) {
          //send location params to the chat page as a new chat message
          this.props.onSend({
            location: {
              longitude: location.coords.longitude,
              latitude: location.coords.latitude,
            },
          })
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Action list menu
  onActionPress = () => {
    const options = [
      'Choose From Library',
      'Take Picture',
      'Send Location',
      'Cancel',
    ]
    const cancelButtonIndex = options.length - 1
    this.context.actionSheet().showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            console.log('user wants to pick an image')
            return this.pickImage()
          case 1:
            console.log('user wants to take a photo')
            return this.takeImage()
          case 2:
            console.log('user wants to get their location')
            return this.getLocation()
          default:
            return
        }
      }
    )
  }

  render() {
    return (
      // button to open the actions menu
      <TouchableOpacity
        accessible={true}
        accessibilityLabel="Actions list"
        accessibilityHint="Pick between sending geolocation, taking photo or choosing image"
        accessibilityRole="button"
        style={[styles.container]}
        onPress={this.onActionPress}
      >
        <View style={[styles.wrapper, this.props.wrapperStyle]}>
          <Text style={[styles.iconText, this.props.iconTextStyle]}>+</Text>
        </View>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: 26,
    height: 26,
    marginLeft: 10,
    marginBottom: 10,
  },
  wrapper: {
    borderRadius: 13,
    borderColor: '#b2b2b2',
    borderWidth: 2,
    flex: 1,
  },
  iconText: {
    color: '#b2b2b2',
    fontWeight: 'bold',
    fontSize: 16,
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
})

// define actionSheet prop as function
CustomActions.contextTypes = {
  actionSheet: PropTypes.func,
}
