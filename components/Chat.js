// TODO fontFamily doesn't work in chat
// TODO custom action on mobile needs to be clicked twice (first click removes kbd)

// Main chat page
import React from 'react'

// Import ui components
import {
  View,
  Platform,
  KeyboardAvoidingView,
  Text,
  StyleSheet,
  LogBox
} from 'react-native'

// Import GiftedChat components
import {
  GiftedChat,
  Bubble,
  InputToolbar,
} from 'react-native-gifted-chat'

// Import react-native localstorage utility
import AsyncStorage from '@react-native-async-storage/async-storage'

// Import library to determite online status
import NetInfo from '@react-native-community/netinfo'

// Import react-native google-maps
import MapView, { Marker } from 'react-native-maps'

// Import CustomActions file
import CustomActions from './CustomActions.js'

//Import Firebase namespace.
import firebase from 'firebase/app'

// Import individual firebase services
import 'firebase/auth'
import 'firebase/database'
import 'firebase/firestore'
import 'firebase/storage'

// Firebase db config info
const firebaseConfig = {
  apiKey: 'AIzaSyCSzK8i5fVqZd7Em_YhBrZ7UD2gRz6oG3Y',
  authDomain: 'yak-99fa5.firebaseapp.com',
  projectId: 'yak-99fa5',
  storageBucket: 'yak-99fa5.appspot.com',
  messagingSenderId: '515312423987',
  appId: '1:515312423987:web:d53edf5f4993b77b053f46',
  measurementId: 'G-Y7R0FCM51R',
}

// Firebase db connection init
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

// Net connection status container
let connectionStatus = null

// Main class
export default class Chat extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      messages: [],
      infoAlert: '',
      uid: 0,
      isConnected: undefined,
    }
    LogBox.ignoreAllLogs()
  }

  componentDidMount() {
    //Netinfo connection listener state
    connectionStatus = NetInfo.addEventListener((state) => {
      //change isConnected state when Netinfo state changes
      this.setState({
        isConnected: state.isConnected,
        infoAlert: state.isConnected === false ? 'YAK is offline!' : '',
      })
    })

    //Display username on page title
    const { username } = this.props.route.params
    this.props.navigation.setOptions({
      title: username ? username : 'YAKker',
    })

    // check online status and run relevant methods
    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        //Firestore collection references
        this.referenceChatMessages = firebase.firestore().collection('messages')

        // set firebase auth listener
        this.authUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
          // if no user is signed-in, then sign-in anonymously
          if (!user) {
            this.setState(
              { infoAlert: 'Authenticating, please wait..' },
              async () => {
                await firebase.auth().signInAnonymously()
                this.setState({ infoAlert: '' })
              }
            )
          }

          //update user state with currently active user data
          this.setState({
            // messages: [],
            uid: user.uid,
          })

          //take snapshot of all data - to be activated when component mounts off
          this.onUnsubscribeMessages = this.referenceChatMessages
            .orderBy('createdAt', 'desc')
            .onSnapshot(this.onCollectionUpdate)
        })
      } else {
        // load messages from local storage
        this.getMessagesFromStorage()
      }
    })
  }

  componentWillUnmount() {
    // unsubscribe from chat updates on unmount
    this.referenceChatMessages &&
      this.authUnsubscribe() &&
      this.onUnsubscribeMessages()
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

  // get string messages from local storage, then parse to JSON format
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

  // save JSON messages to local storage in string format
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

  onSend(messages = []) {
    // update giftedchat messages state
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        // add to db
        this.referenceChatMessages.add(messages[0])
        // add to local storage
        this.saveMessagesToStorage()
      }
    )
  }

  // returns a custom action button on the left of the message composer
  renderCustomActions = (props) => {
    return <CustomActions {...props} />
  }

  // returns a MapView container to display user location on google maps
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
          <Marker
            coordinate={{
              latitude: currentMessage.location.latitude,
              longitude: currentMessage.location.longitude,
            }}
            title="My location"
          />
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
        {/* user info alert display */}
        <Text style={styles.infoAlert}>{this.state.infoAlert}</Text>

        {/* Chat settings */}
        <GiftedChat
          accessible
          accessibilityLabel="A chat bubble"
          accessibilityHint="A single chat bubble containing user input"
          accessibilityRole="text"
          messages={this.state.messages}
          onSend={(messages) => this.onSend(messages)}
          renderBubble={this.renderBubble}
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
        />

        {/* small devices keyboard display fix */}
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
    zIndex: 10,
    fontFamily: 'Bold',
  },
})
