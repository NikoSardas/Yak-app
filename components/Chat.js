//Main chat page
import React from 'react'

//Require ui components
import {
  View,
  Platform,
  KeyboardAvoidingView,
  Text,
  StyleSheet,
  Image,
} from 'react-native'

import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat'

// firebase namespace.
import firebase from 'firebase/app'

// individual firebase services
import 'firebase/auth'
import 'firebase/database'
import 'firebase/firestore'
import 'firebase/storage'

//react-native localstorage utility
import AsyncStorage from '@react-native-async-storage/async-storage'

//library to find out if a user is online or not
import NetInfo from '@react-native-community/netinfo'

import MapView, { Marker } from 'react-native-maps'

import CustomActions from './CustomActions.js'

// db config info
const firebaseConfig = {
  apiKey: 'AIzaSyCSzK8i5fVqZd7Em_YhBrZ7UD2gRz6oG3Y',
  authDomain: 'yak-99fa5.firebaseapp.com',
  projectId: 'yak-99fa5',
  storageBucket: 'yak-99fa5.appspot.com',
  messagingSenderId: '515312423987',
  appId: '1:515312423987:web:d53edf5f4993b77b053f46',
  measurementId: 'G-Y7R0FCM51R',
}

// db connection init
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

// net connection status container
// let unsubscribeNetInfo = null

//Main class
export default class Chat extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      messages: [],
      infoAlert: '',
      uid: '',
      isConnected: undefined,
      image: null,
      location: null,
    }
  }

  componentDidMount() {
    // set connection listener
    //  unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    //   this.setState({
    //     isConnected: state.isConnected,
    //   })
    // })

    //Display username
    const { username } = this.props.route.params
    this.props.navigation.setOptions({
      title: username ? username : 'YAKker',
    })

    // check online status
    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        this.setState({ infoAlert: '', isConnected: true })
        //Firestore collection references
        this.referenceChatMessages = firebase.firestore().collection('messages')

        // Firestore document references
        // this.referenceChatMessagesDoc = firebase
        //   .firestore()
        //   .collection('messages')
        //   .doc('list')

        // // Firestore user references
        // this.referenceChatUser = firebase
        //   .firestore()
        //   .collection('messages')
        //   .where('uid', '==', this.state.uid)

        //take snapshot of user data - to be activated when component mounts off
        // this.unsubscribeChatUser = this.referenceChatUser.onSnapshot(
        //   this.onCollectionUpdate
        // )

        // set firebase auth listener
        this.authUnsubscribe = firebase
          .auth()
          .onAuthStateChanged(async (user) => {
            // if no user is signed-in, then sign-in anonymously
            if (!user) {
              this.setState({ infoAlert: 'Authenticating, please wait..' })
              await firebase.auth().signInAnonymously()
              this.setState({ infoAlert: '' })
            }

            //update user state with currently active user data
            this.setState({
              messages: [],
              uid: user.uid,
              // user: {
              //   _id: user.uid,
              //   name: username,
              // avatar: 'https://placeimg.com/140/140/any',
              // },
            })

            //take snapshot of all data - to be activated when component mounts off
            this.unsubscribeAuth = this.referenceChatMessages
              .orderBy('createdAt', 'desc')
              .onSnapshot(this.onCollectionUpdate)
          })
      } else {
        this.setState({ infoAlert: 'YAK is Offline', isConnected: false })
        this.getMessages()
      }
    })
  }

  componentWillUnmount() {
    // unsubscribe methods on unmount
    // unsubscribeNetInfo()
    this.referenceChatMessages && this.unsubscribeAuth()
  }

  // set data format when taking snapshots
  onCollectionUpdate = (querySnapshot) => {
    const messages = []
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      var data = doc.data()
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: data.user,
        avatar: data.avatar,
      })
    })
    this.setState({
      messages,
    })
  }

  // get messages from local storage
  async getMessages() {
    let messages = ''
    try {
      messages = (await AsyncStorage.getItem('messages')) || []
      this.setState({
        messages: JSON.parse(messages),
      })
    } catch (error) {
      console.log(error.message)
    }
  }

  // save messages to local storage
  async saveMessagesToStorage() {
    try {
      await AsyncStorage.setItem(
        'messages',
        JSON.stringify(this.state.messages)
      )
    } catch (error) {
      console.log(error.message)
    }
  }

  // delete messages from local storage
  async deleteMessages() {
    try {
      await AsyncStorage.removeItem('messages')
      this.setState({
        messages: [],
      })
    } catch (error) {
      console.log(error.message)
    }
  }

  // inputToolbar show only when connected
  renderInputToolbar = (props) => {
    return this.state.isConnected && <InputToolbar {...props} />
  }

  // Chat bubble parameters
  renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: 'white',
            color: 'black',
          },
          right: {
            backgroundColor: 'black',
            color: 'white',
          },
        }}
      />
    )
  }

  // append message to GiftedChat screen and send to db on the callback
  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.referenceChatMessages.add(messages[0])
        this.saveMessagesToStorage()
      }
    )
  }

  renderCustomActions = (props) => {
    return <CustomActions {...props} />
  }

  renderCustomView(props) {
    const { currentMessage } = props
    if (currentMessage.location) {
      return (
        <MapView
          style={{ width: 150, height: 100, borderRadius: 13, margin: 3 }}
          region={{
            latitude: currentMessage.location.latitude,
            longitude: currentMessage.location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        />
      )
    }
    return null
  }

  render() {
    // if (this.state.hasPermission === null) {
    //   return <View />
    // }
    // if (this.state.hasPermission === false) {
    //   return <Text>No access to camera</Text>
    // }
    return (
      <View
        style={{
          backgroundColor: this.props.route.params.backgroundColor,
          flex: 1,
          justifyContent: 'center',
          paddingTop: 40,
        }}
      >
        <Text style={styles.infoAlert}>{this.state.infoAlert}</Text>

        <GiftedChat
          accessible
          accessibilityLabel="A chat bubble"
          accessibilityHint="A single chat bubble containing user input"
          accessibilityRole="text"
          messages={this.state.messages}
          renderBubble={this.renderBubble}
          onSend={(messages) => this.onSend(messages)}
          placeholder="Type a message..."
          renderActions={this.renderCustomActions}
          renderCustomView={this.renderCustomView}
          showUserAvatar
          isTyping
          renderUsernameOnMessage
          alwaysShowSend
          renderInputToolbar={this.renderInputToolbar}
          user={{
            name: this.props.route.params.username,
            _id: this.state.uid,
            avatar: 'https://placeimg.com/140/140/any',
          }}
        ></GiftedChat>

        {Platform.OS === 'android' ? (
          <KeyboardAvoidingView behavior="height" />
        ) : null}

        {this.state.image && (
          <Image
            source={{ uri: this.state.image.uri }}
            style={{ width: 200, height: 200 }}
          />
        )}

        {this.state.location && (
          <MapView
            style={{ width: 300, height: 200 }}
            region={{
              latitude: this.state.location.coords.latitude,
              longitude: this.state.location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          />
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  infoAlert: {
    textAlign: 'center',
    color: 'white',
  },
})
