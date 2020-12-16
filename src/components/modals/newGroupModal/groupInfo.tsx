import React, { useState } from 'react'
import { useObserver } from 'mobx-react-lite'
import { useStores, useTheme } from '../../../store'
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native'
import { Portal, IconButton, Button, Dialog, TextInput } from 'react-native-paper'
import ModalWrap from '../modalWrap'
import Header from './header'
import FadeView from '../../utils/fadeView'
import People from './people'
import { useChatPicSrc, createChatPic } from '../../utils/picSrc'
import moment from 'moment'
import { Contact, DeletableContact, PendingContact } from './items'
import EE, { LEFT_GROUP } from '../../utils/ee'
import ImagePicker from 'react-native-image-picker';
import { constants } from '../../../constants'
import Avatar from '../../chat/msg/avatar'
import Slider from '@react-native-community/slider';

export default function GroupInfo({ visible }) {
  const { ui, contacts, chats, user, msg } = useStores()
  const theme = useTheme()
  const [selected, setSelected] = useState([])
  const [addPeople, setAddPeople] = useState(false)
  const [loading, setLoading] = useState(false)
  const [leaveDialog, setLeaveDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [loadingTribe, setLoadingTribe] = useState(false)
  
  const group = ui.groupModalParams

  const [alias,setAlias] = useState((group&&group['my_alias'])||'')
  function maybeUpdateAlias(){
    if(!(group&&group.id)) return
    if(alias!==group['my_alias']) {
      chats.updateMyInfoInChat(group.id, alias, '')
    }
  }

  let initppm = chats.pricesPerMinute[group.id]
  if(!(initppm||initppm===0)) initppm = group.pricePerMinute||5
  const [ppm,setPpm] = useState(initppm)

  async function onKickContact(cid) {
    await chats.kick(group.id, cid)
  }

  function close() {
    ui.closeGroupModal()
    // setTimeout(() => {
    //   setSelected([])
    //   setLeaveDialog(false)
    // }, 200)
  }

  async function addGroupMembers() {
    if (!(selected && selected.length)) {
      return
    }
    setLoading(true)
    await chats.addGroupMembers(group.id, selected)
    setLoading(false)
    close()
  }

  async function exitGroup() {
    setLoading(true)
    await chats.exitGroup(group.id)
    setLoading(false)
    close()
    EE.emit(LEFT_GROUP)
  }

  async function onApproveOrDenyMember(contactId, status) {
    // find msgId
    const msgs = msg.messages[group.id]
    if (!msgs) return
    const theMsg = msgs.find(m => m.sender === contactId && m.type === constants.message_types.member_request)
    if (!theMsg) return
    await msg.approveOrRejectMember(contactId, status, theMsg.id)
  }

  const uri = useChatPicSrc(group)

  const hasGroup = group ? true : false
  const hasImg = uri ? true : false

  function changePic() {
    return
    ImagePicker.launchImageLibrary({}, async img => {
      if (!img.didCancel) {
        if (group && group.id && img && img.uri) {
          await createChatPic(group.id, img.uri)
          chats.updateChatPhotoURI(group.id, img.uri)
          close()
        }
      }
    })
  }

  const isTribe = group && group.type === constants.chat_types.tribe
  const isTribeAdmin = isTribe && group.owner_pubkey === user.publicKey

  /**
   * RenderContact
   */
  const renderContact: any = ({ item, index }: any) => {
    if (isTribeAdmin) {
      return <DeletableContact key={index} contact={item} onDelete={onKickContact} />
    }
    return <Contact key={index} contact={item} unselectable={true} />
  }

  /**
   * RenderPendingContactsToShow
   */
  const renderPendingContactsToShow: any = ({ item, index }: any) => (
    <PendingContact
      key={index}
      contact={item}
      onApproveOrDenyMember={onApproveOrDenyMember}
    />
  )

  const dotsVerticalHandler = () => {
    if (isTribeAdmin) setEditDialog(true)
    else setLeaveDialog(true)
  }

  const onSetAddPeopleHandler = () => setAddPeople(true)
  const setLeaveDialogToFalseHandler = () => setLeaveDialog(false)
  const onExitGroupHandler = () => {
    if (!loading) exitGroup()
  }
  const setEditDialogToFalseHandler = () => setEditDialog(false)

  function fuzzyIndexOf(arr, n){
    let smallestDiff = Infinity
    let index = -1
    arr.forEach((m,i)=>{
      const diff = Math.abs(m-n)
      if(diff<smallestDiff) {
        smallestDiff = diff
        index = i
      }
    })
    return index
  }

  const ppms = [0,3,5,10,20,50,100]
  function chooseSatsPerMinute(n){
    if(!group.id) return
    const price = ppms[n] || 0
    chats.setPricePerMinute(group.id,price)
  }
  function satsPerMinuteChanged(n){
    setPpm(ppms[n]||0)
  }
  let sliderValue = fuzzyIndexOf(ppms,ppm)
  if(sliderValue<0) sliderValue=2

  const showValueSlider = (isTribe && !isTribeAdmin && (group&&group.feed_url)) ? true : false

  return useObserver(() => {
    const contactsToShow = contacts.contacts.filter(c => {
      return c.id > 1 && group && group.contact_ids.includes(c.id)
    })
    const pendingContactsToShow = (contacts.contacts.filter(c => {
      return c.id > 1 && group && group.pending_contact_ids && group.pending_contact_ids.includes(c.id)
    })) || []
    const selectedContacts = contacts.contacts.filter(c => selected.includes(c.id))
    const showSelectedContacts = selectedContacts.length > 0
    return <ModalWrap onClose={close} visible={visible}
      propagateSwipe={true}>
      <Portal.Host>
        <Header title={addPeople ? 'Add Contacts' : 'Group'}
          showNext={addPeople && showSelectedContacts}
          onClose={close} nextButtonText="Add"
          next={addGroupMembers} loading={loading}
        />

        <FadeView opacity={!addPeople ? 1 : 0} style={styles.content}>

          {hasGroup && <View style={styles.groupInfo}>
            <View style={styles.groupInfoLeft}>
              <TouchableOpacity onPress={changePic}>
                {group && <Avatar big alias={group.name} photo={uri || ''} />}
              </TouchableOpacity>
              <View style={styles.groupInfoText}>
                <Text style={{...styles.groupInfoName,color:theme.title}}>{group.name}</Text>
                <Text style={styles.groupInfoCreated}>{`Created on ${moment(group.created_at).format('ll')}`}</Text>
                <Text style={{...styles.groupInfoPrices,color:theme.subtitle}}>
                  {`Price per message: ${group.price_per_message}, Amount to stake: ${group.escrow_amount}`}
                </Text>
              </View>
            </View>
            <IconButton icon="dots-vertical" size={32} color="#666"
              style={{ marginLeft: 0, marginRight: 0, position:'absolute', right:4 }}
              onPress={dotsVerticalHandler}
            />
          </View>}

          {showValueSlider && <View style={styles.slideWrap}>
            <View style={styles.slideText}>
              <Text style={{...styles.slideLabel,color:theme.subtitle}}>Podcast: sats per minute</Text>
              <Text style={{...styles.slideValue,color:theme.subtitle}}>{ppm}</Text>
            </View>
            <Slider minimumValue={0} maximumValue={6} value={sliderValue} step={1}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.primary}
              thumbTintColor={theme.primary}
              onSlidingComplete={chooseSatsPerMinute}
              onValueChange={satsPerMinuteChanged}
              style={{width:'90%'}}
            />
          </View>}

          <View style={styles.inputWrap}>
            <Text style={{...styles.inputLabel,color:theme.subtitle}}>My Name in this tribe</Text>
            <TextInput mode="outlined"
              placeholder="Your Name in this Tribe"
              onChangeText={e=> setAlias(e)}
              value={alias}
              style={styles.input}
              // onFocus={()=> setKey(true)}
              onBlur={maybeUpdateAlias}
            />
          </View>

          {(!isTribe || isTribeAdmin) && <View style={styles.members}>
            {contactsToShow && contactsToShow.length > 0 && <>
              <Text style={styles.membersTitle}>GROUP MEMBERS</Text>
              <FlatList
                style={styles.scroller}
                data={contactsToShow}
                renderItem={renderContact}
                keyExtractor={(item) => String(item.id)}
              />
            </>}
            {isTribeAdmin && pendingContactsToShow.length > 0 && <>
              <Text style={styles.membersTitle}>PENDING GROUP MEMBERS</Text>
              <FlatList
                style={styles.scroller}
                data={pendingContactsToShow}
                renderItem={renderPendingContactsToShow}
                keyExtractor={(item) => String(item.id)}
              />
            </>}
            {!isTribeAdmin && <Button mode="contained" dark={true} icon="plus"
              onPress={onSetAddPeopleHandler}
              style={styles.addPeople}>
              Add People
            </Button>}
          </View>}

        </FadeView>

        <FadeView opacity={addPeople ? 1 : 0} style={styles.content}>
          <People setSelected={setSelected}
            initialContactIds={(group && group.contact_ids) || []}
          />
        </FadeView>

        <Portal>
          <Dialog visible={leaveDialog} style={{ bottom: 10, zIndex: 99 }}
            onDismiss={setLeaveDialogToFalseHandler}>
            <Dialog.Title>Exit Group?</Dialog.Title>
            <Dialog.Actions style={{ justifyContent: 'space-between' }}>
              <Button icon="cancel" onPress={setLeaveDialogToFalseHandler} color="#888">
                Cancel
              </Button>
              <Button icon="exit-to-app" onPress={onExitGroupHandler}
                loading={loading} color="#DB5554">
                Exit Group
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog visible={editDialog} style={{ bottom: 10, zIndex: 99 }}
            onDismiss={setEditDialogToFalseHandler}>
            <Dialog.Title>Group Settings</Dialog.Title>
            <Dialog.Actions style={{ justifyContent: 'space-between', flexDirection: 'column', alignItems: 'flex-start', height: 150 }}>
              <Button loading={loadingTribe} icon="pencil" onPress={async () => {
                setLoadingTribe(true)
                const params = await chats.getTribeDetails(group.host, group.uuid)
                if (params) ui.setEditTribeParams({ id: group.id, ...params })
                setEditDialog(false)
                setLoadingTribe(false)
              }}>
                Edit Group
              </Button>
              <Button icon="share" onPress={async () => {
                ui.setShareTribeUUID(group.uuid)
                setEditDialog(false)
              }}>
                Share Group
              </Button>
              <Button icon="cancel" onPress={setEditDialogToFalseHandler} color="#888">
                Cancel
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

      </Portal.Host>
    </ModalWrap>
  })
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 40,
  },
  groupInfo: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  groupInfoLeft: {
    marginLeft: 16,
    display: 'flex',
    flexDirection: 'row',
  },
  groupInfoText: {
    display: 'flex',
    height: 54,
    justifyContent: 'center',
    marginLeft: 14,
    maxWidth:'77%',
  },
  groupInfoName: {
    color: 'black',
    fontSize: 16,
  },
  groupInfoCreated: {
    color: '#888',
    fontSize: 10,
  },
  groupInfoPrices:{
    fontSize: 10,
  },
  members: {
    marginTop: 19,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  membersTitle: {
    color: '#888',
    fontSize: 14,
    marginLeft: 16,
  },
  membersList: {

  },
  scroller: {
    width: '100%',
    position: 'relative',
  },
  addPeople: {
    height: 46,
    borderRadius: 23,
    width: 160,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#55D1A9',
    marginLeft: 16,
    marginTop: 16,
    zIndex: 8
  },
  slideWrap:{
    width:'100%',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    height:62,
    marginTop:20
  },
  slideText:{
    width:'90%',
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    paddingLeft:15,paddingRight:15,
    marginBottom:10
  },
  slideLabel:{
    fontSize:13
  },
  slideValue:{
    fontSize:15,
    fontWeight:'bold'
  },
  inputWrap:{
    display:'flex',
    marginTop:15,
  },
  inputLabel:{
    fontSize:11
  },
  input:{
    maxHeight:55,
    minWidth:240
  }
})

