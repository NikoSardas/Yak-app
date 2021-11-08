import React from 'react'
import PropTypes from 'prop-types'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import * as ImagePicker from 'expo-image-picker'
// import { Camera } from 'expo-camera'
import * as Location from 'expo-location'

import firebase from 'firebase'

export default class CustomActions extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      location: null,
    }
  }

  pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    try {
      if (status === 'granted') {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        }).catch((error) => console.log(error.message))

        if (!result.cancelled) {
          const imageUrl = await this.uploadImage(result.uri)
          this.props.onSend({ image: imageUrl })
        }
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  takeImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()

    try {
      if (status === 'granted') {
        let result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
        }).catch((error) => console.log(error.message))

        if (!result.cancelled) {
          const imageUrl = await this.uploadImage(result.uri)
          this.props.onSend({ image: imageUrl })
        }
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  uploadImage = async (imageURI) => {
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

    const ref = firebase
      .storage()
      .ref()
      .child(`images/${new Date()}`)

    const snapshot = await ref.put(blob)

    blob.close()

    return await snapshot.ref.getDownloadURL()
  }

  getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    try {
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch((error) => {
          console.error(error)
        })

        console.log('location', location)

        if (location) {
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

CustomActions.contextTypes = {
  actionSheet: PropTypes.func,
}
