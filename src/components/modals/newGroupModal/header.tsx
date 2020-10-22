import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { IconButton } from 'react-native-paper'
import { useTheme } from '../../../store'

export default function Header(props) {
  const theme = useTheme()
  const { title, onClose, showNext, nextButtonText, loading } = props
  return <View style={{ ...moreStyles.header, ...props.background && { backgroundColor: props.background } }}>
    <IconButton
      icon="arrow-left"
      color="grey"
      size={22}
      style={{ marginLeft: 14, marginTop: 8 }}
      onPress={() => onClose()}
    />
    <Text style={{...moreStyles.headerTitle,color:theme.title}}>{title}</Text>
    <View style={moreStyles.headerRighty}>
      {showNext && <TouchableOpacity style={moreStyles.button}
        onPress={() => props.next()} disabled={loading}>
        <Text style={moreStyles.buttonTxt}>
          {nextButtonText || 'Next'}
        </Text>
      </TouchableOpacity>}
    </View>
  </View>
}

const moreStyles = StyleSheet.create({
  header: {
    height: 50,
    minHeight: 50,
    width: '100%',
    paddingLeft: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16
  },
  headerRighty: {
    width: 90,
  },
  button: {
    height: 30,
    width: 80,
    borderRadius: 15,
    backgroundColor: '#6289FD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 100
  },
  buttonTxt: {
    color: 'white',
    fontSize: 12,
  }
})
