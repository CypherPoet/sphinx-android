import React, {useState, useEffect} from 'react'
import {View,StyleSheet,Text,Image,TextInput} from 'react-native'
import {Button} from 'react-native-paper'
import { useStores } from '../../store'
import RadialGradient from 'react-native-radial-gradient'
import Slider from '../utils/slider'
import { constants } from '../../constants'
import actions from '../../store/actions'

export default function Ready(props) {
  const {z,show,onDone} = props
  const {user,contacts,chats} = useStores()
  const [loading, setLoading] = useState(false)
  async function finish(){
    setLoading(true)
    await Promise.all([
      user.finishInvite(),
      contacts.addContact({
        alias: user.invite.inviterNickname,
        public_key: user.invite.inviterPubkey,
        status: constants.contact_statuses.confirmed,
      }),
      actions(user.invite.action),
      chats.joinDefaultTribe()
    ])
    setLoading(false)
    onDone()
  }
  return <Slider z={z} show={show} accessibilityLabel="onboard-ready">
    <RadialGradient style={styles.gradient}
      colors={['#A68CFF','#6A8FFF']}
      stops={[0.1,1]}
      center={[80,40]}
      radius={400}>
      <View style={styles.titleWrap} accessibilityLabel="onboard-ready-title">
        <View style={styles.titleRow}>
          <Text style={styles.title}>You're</Text>
          <Text style={styles.boldTitle}>ready</Text>
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title}>to use Sphinx</Text>
        </View>
      </View>
      <View style={styles.msgWrap} accessibilityLabel="onboard-ready-message">
        <View style={styles.msgRow}>
          <Text style={styles.msg}>You can send messages</Text>
        </View>
        <View style={styles.msgRow}>
          <Text style={styles.msg}>spend</Text>
          <Text style={styles.msgBold}>1000 sats,</Text>
          <Text style={styles.msg}>or receive</Text>
        </View>
        <View style={styles.msgRow}>
          <Text style={styles.msg}>up to</Text>
          <Text style={styles.msgBold}>10000 sats</Text>
        </View>
      </View>
      <View style={styles.buttonWrap} accessibilityLabel="onboard-ready-button-wrap">
        <Button mode="contained"
          accessibilityLabel="onboard-ready-button"
          loading={loading}
          onPress={finish}
          style={styles.button}>
          Finish
        </Button>
      </View>
    </RadialGradient>
  </Slider>
}

const styles = StyleSheet.create({
  gradient:{
    flex:1,
    alignItems:'center',
    justifyContent:'center',
    width:'100%',
  },
  titleWrap:{
    display:'flex',
    width:'100%',
  },
  titleRow:{
    display:'flex',
    flexDirection:'row',
    width:'100%',
    justifyContent:'center'
  },
  title:{
    color:'white',
    fontSize:40,
  },
  boldTitle:{
    fontWeight:'bold',
    color:'white',
    fontSize:40,
    marginLeft:10,
    marginRight:10
  },
  msgWrap:{
    display:'flex',
    maxWidth:220,
    marginTop:42,
    marginBottom:100,
    width:'100%'
  },
  msgRow:{
    display:'flex',
    flexDirection:'row',
    width:'100%',
    justifyContent:'center'
  },
  msg:{
    color:'white',
    fontSize:20,
    textAlign:'center',
    lineHeight:28
  },
  msgBold:{
    color:'white',
    fontWeight:'bold',
    fontSize:20,
    marginLeft:8,
    marginRight:8,
    lineHeight:28
  },
  buttonWrap:{
    position:'absolute',
    bottom:42,
    width:'100%',
    height:60,
    display:'flex',
    flexDirection:'row',
    justifyContent:'center'
  },
  button:{
    width:'75%',
    borderRadius:30,
    height:60,
    display:'flex',
    justifyContent:'center',
    backgroundColor:'white'
  }, 
})


async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}