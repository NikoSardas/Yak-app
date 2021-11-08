//Main chat page
import React from 'react'

//Require ui components
import {
  View,
  Platform,
  KeyboardAvoidingView,
  Text,
  StyleSheet,
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

//library to determite online status
import NetInfo from '@react-native-community/netinfo'

//react-native google-maps
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
let unsubscribeNetInfo = null

//Main class
export default class Chat extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      messages: [],
      infoAlert: '',
      uid: 0,
      isConnected: undefined,
    }
  }

  componentDidMount() {
    //set connection listener
    unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      console.log(state)
      this.setState({
        isConnected: state.isConnected,
      })
    })

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
            })

            //take snapshot of all data - to be activated when component mounts off
            this.unsubscribeAuth = this.referenceChatMessages
              .orderBy('createdAt', 'desc')
              .onSnapshot(this.onCollectionUpdate)
          })
      } else {
        this.setState({ infoAlert: 'YAK is Offline', isConnected: false })
        // load messages from local storage
        this.getMessagesFromStorage()
      }
    })
  }

  componentWillUnmount() {
    // unsubscribe methods on unmount
    unsubscribeNetInfo()
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
        image: data.image || null,
        location: data.location || null,
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar,
        },
      })
    })
    this.setState({
      messages,
    })
  }

  // get messages from local storage
  async getMessagesFromStorage() {
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
            fontFamily: 'Regular',
            backgroundColor: 'white',
            color: 'black',
          },
          right: {
            fontFamily: 'Regular',
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
        >
          {/* <Marker
            coordinate={{
              latitude: currentMessage.location.latitude,
              longitude: currentMessage.location.longitude,
            }}
            title="My location"
          /> */}
        </MapView>
      )
    }
    return null
  }

  render() {
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
