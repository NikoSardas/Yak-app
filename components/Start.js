// Start page
import React from 'react'

// Import ui components
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  ImageBackground,
  TouchableOpacity,
} from 'react-native'

// Import icons and images
import bgImg from '../assets/Background_Image.png'
import Icon from 'react-native-vector-icons/FontAwesome'

// Array of colors to select backgrounds from
const bgColors = ['#3b392a', '#2a2d3b', '#2a3b2d', '#3b2a2a']

export default class Start extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      username: 'YAKker',
      backgroundColor: '#2a2d3b',
    }
  }

  // Returns a background color key set by color param
  setExampleBackground = (color) => {
    return {
      backgroundColor: color,
    }
  }

  //sets new background color state
  changeBackground = (backgroundColor) => {
    this.setState({
      backgroundColor,
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={bgImg}
          resizeMode="cover"
          style={styles.bgImage}
        >
          {/* main title */}
          <Text style={styles.titleText}>YAK</Text>

          {/* user box */}
          <View
            style={{
              backgroundColor: this.state.backgroundColor,
              minHeight: 240,
              maxHeight: 240,
              flex: 1,
              marginHorizontal: '6%',
              marginVertical: '6%',
            }}
          >
            {/* text input */}
            <View style={styles.textInputView}>
              <Icon
                style={styles.textIcon}
                name="user"
                size={30}
                color="#888"
              />
              <TextInput
                accessible
                accessibilityLabel="Name input"
                accessibilityHint="A text field for the username input"
                style={styles.textInput}
                onChangeText={(username) => this.setState({ username })}
                value={this.state.username}
                placeholder="Your Name"
                placeholderTextColor="#888"
              />
            </View>

            {/* color switch */}
            <View style={styles.backgroundsWrapper}>
              <Text
                accessible
                accessibilityLabel="Choose background color"
                accessibilityHint="A text field presenting the background color chooser"
                accessibilityRole="text"
                style={styles.backgroundsText}
              >
                Choose Background Color
              </Text>
              <View style={styles.backgroundColorsWrapper}>
                {bgColors.map((color) => (
                  <TouchableOpacity
                    accessible
                    accessibilityLabel="Background color setter"
                    accessibilityHint="A button for selecting a background color"
                    accessibilityRole="button"
                    key={color}
                    onPress={() => {
                      this.changeBackground(color)
                    }}
                    style={[styles.bgColor, this.setExampleBackground(color)]}
                  ></TouchableOpacity>
                ))}
              </View>
            </View>

            {/* chat button */}
            <TouchableOpacity
              accessible
              accessibilityLabel="Click to enter chat"
              accessibilityHint="A button for entering the chat"
              accessibilityRole="button"
              style={styles.enterChatButton}
              onPress={() =>
                this.props.navigation.navigate('Chat', {
                  username: this.state.username,
                  backgroundColor: this.state.backgroundColor,
                })
              }
            >
              <Text style={styles.chatButtonText}>Start YAKking</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignContent: 'center',
  },
  bgImage: {
    flex: 1,
  },
  titleText: {
    fontFamily: 'Bold',
    flex: 1,
    paddingTop: 100,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 45,
    color: '#FFFFFF',
    textShadowColor: 'black',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  textInputView: {
    flexDirection: 'row',
    margin: 10,
    padding: 2,
    color: '#dbdbdb',
    borderColor: 'gray',
    borderWidth: 1,
    alignItems: 'center',
  },
  textIcon: {
    color: '#dbdbdb',
  },
  textInput: {
    fontFamily: 'Regular',
    color: '#FFFFFF',
    marginLeft: 10,
    paddingLeft: 10,
    width: '100%',
  },
  backgroundsWrapper: {
    flex: 1,
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderColor: '#888',
  },
  backgroundsText: {
    fontFamily: 'Regular',
    textAlign: 'center',
    color: '#dbdbdb',
  },
  backgroundColorsWrapper: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  bgColor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'black',
  },
  enterChatButton: {
    margin: 10,
    padding: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#888',
  },
  chatButtonText: {
    fontFamily: 'Regular',
    color: '#dbdbdb',
    textAlign: 'center',
  },
})
