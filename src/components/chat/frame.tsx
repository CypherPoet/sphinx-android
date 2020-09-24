import React, { useRef, useState } from 'react'
import 'react-native-get-random-values';
import { WebView } from 'react-native-webview'
import { View, ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { Button } from 'react-native-paper'
import { useStores } from '../../store'
import {randString} from '../../crypto/rand'

export default function Webview({ url }) {
  const { user, msg, auth } = useStores()
  const [bridge, setBridge] = useState(null)
  const [password,setPassword] = useState('')
  const [savedPubkey,setSavedPubkey] = useState('')
  const [savedBudget,setSavedBudget] = useState(0)
  const ref = useRef(null)

  async function onMessage(m) {
    const data = m.nativeEvent.data
    try {
      const d = JSON.parse(data)
      console.log("=> WEBVIEW:", d.type, d)
      if (d.type === 'AUTHORIZE') {
        setBridge({ ...d, url })
      }
      if (d.type === 'KEYSEND') {
        const amt = d.amt
        const dest = d.dest
        if (!amt || !dest) return console.log("missing dest or amt")
        await msg.sendPayment({
          contact_id: null, chat_id: null,
          destination_key: dest,
          amt: amt,
          memo: '',
        })
        postMessage({
          type: 'KEYSEND',
          success: true,
        })
      }
      if (d.type === 'UPDATED') {
        postMessage({
          type: 'UPDATED',
          success: true,
        })
      }
      if(data.type==='RELOAD') {
        const pass = data.password
        let success = false
        let budget = 0
        let pubkey = ''
        if(pass && pass===password) {
          success = true
          budget = savedBudget || 0
          pubkey = savedPubkey || ''
        }
        postMessage({
          type: 'RELOAD',
          success, budget, pubkey
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  async function postMessage(args) {
    if (ref && ref.current) {
      const pass:string = await randString(16)
      setPassword(pass)
      if(args.budget || args.budget===0) setSavedBudget(args.budget)
      if(args.pubkey) setSavedPubkey(args.pubkey)
      ref.current.postMessage(JSON.stringify({
        ...args,
        application:'Sphinx',
        password:pass
      }))
    }
  }

  async function authorize(amt, challenge: string) {
    let sig = ''
    if (challenge) {
      sig = await auth.sign(challenge)
    }
    postMessage({
      type: 'AUTHORIZE',
      budget: parseInt(amt) || 0,
      pubkey: user.publicKey,
      signature: sig,
    })
    setBridge(null)
  }

  function onErrorHandler() {
    if (ref && ref.current) {
      ref.current.reload()
    }
  }

  function onCloseBridgeHandler() {
    setBridge(null)
  }

  return <View style={styles.webview}>
    {bridge && bridge.url && <BridgeModal params={bridge} onClose={onCloseBridgeHandler}
      authorize={authorize}
    />}
    <WebView ref={ref}
      userAgent="Sphinx"
      incognito={true}
      nativeConfig={{ props: { webContentsDebuggingEnabled: true } }}
      onMessage={onMessage}
      startInLoadingState={true}
      renderLoading={LoadingView}
      automaticallyAdjustContentInsets={false}
      scalesPageToFit={true}
      contentInset={{ top: 0, right: 0, bottom: 0, left: 0 }}
      source={{ uri: url }}
      javaScriptEnabled={true}
      scrollEnabled={false}
      originWhitelist={['*']}
      onError={onErrorHandler}
    />
  </View>
}

function LoadingView() {
  return <View style={styles.loader}>
    <ActivityIndicator
      animating={true}
      color='grey'
      size="large"
      hidesWhenStopped={true}
    />
  </View>
}

function BridgeModal({ params, authorize, onClose }) {
  const [amt, setAmt] = useState('1000')
  const [authorizing, setAuthorizing] = useState(false)
  const showBudget = params.noBudget?false:true

  async function onAuthorizingHandler() {
    if (authorizing) return
    setAuthorizing(true)
    await authorize(showBudget?amt:0, params.challenge)
    setAuthorizing(false)
  }

  return <View style={styles.bridgeModal}>
    <Icon name="shield-check" size={54} color="#6289FD"
      style={{ marginRight: 4, marginLeft: 4 }}
    />
    <Text style={styles.modalText}>Do you want to authorize</Text>
    <Text style={styles.modalURL}>{params.url}</Text>
    {showBudget && <>
      <Text style={styles.modalText}>To withdraw up to</Text>
      <View style={styles.inputWrap}>
        <View style={styles.inputInnerWrap}>
          <TextInput value={amt}
            onChangeText={t => setAmt(t)}
            placeholder="Application Budget"
          />
          <Text style={styles.modalSats}>sats</Text>
        </View>
      </View>
    </>}
    <View style={styles.modalButtonWrap}>
      <Button labelStyle={{ color: 'grey' }} mode="contained" dark={true} style={{ ...styles.button, backgroundColor: '#ccc' }}
        onPress={onClose}>
        No
      </Button>
      <Button mode="contained" dark={true} style={{ ...styles.button }}
        onPress={onAuthorizingHandler} loading={authorizing}>
        Yes
      </Button>
    </View>
  </View>
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    position: 'relative',
    zIndex: 99,
  },
  loader: {
    position: 'absolute',
    top: 48,
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  bridgeModal: {
    position: 'absolute',
    top: 20,
    width: '92%',
    left: '4%',
    height: 'auto',
    backgroundColor: 'white',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 30,
    elevation: 5,
    borderRadius: 12,
  },
  modalText: {
    color: '#888',
    marginTop: 12,
    marginBottom: 12
  },
  modalURL: {
    marginTop: 12,
    marginBottom: 12,
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    height: 36,
    borderRadius: 18,
    marginTop: 12,
    fontSize: 13,
    paddingLeft: 12,
    marginBottom: 20
  },
  inputWrap: {
    width: '100%',
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  inputInnerWrap: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#aaa',
    width: '60%',
    borderRadius: 24,
    paddingLeft: 10,
  },
  modalSats: {
    position: 'absolute',
    right: 19,
    top: 15,
    color: '#888'
  },
  modalButtonWrap: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 15
  },
  button: {
    borderRadius: 20,
    width: 90, height: 38,
    marginLeft: 15, marginRight: 15
  }
})
