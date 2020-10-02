import * as PushNotification from 'react-native-push-notification'

export function configure(callback, finishCallback){
  PushNotification.configure({
    // (optional) Called when Token is generated (iOS and Android)
    onRegister: function (token) {
      // console.log("TOKEN",token)
      // PushNotification.getChannels(function (channel_ids) {
      //   console.log("CHAN IDS",channel_ids); // ['channel_id_1']
      // });
      if(callback) callback(token)
    },

    // (required) Called when a remote or local notification is opened or received
    onNotification: function (notification) {
      console.log("NOTIFICATION:", notification);
      notification.finish()
      finishCallback(notification)
      // notification.data&&notification.data.message && notify(notification.data.message)
      // if(notification.userInteraction && notification.finish) {
      //   notification.finish()
      //   PushNotification.setApplicationIconBadgeNumber(0)
      // }
    },

    // ANDROID ONLY: FCM Sender ID (product_number) (optional - not required for local notifications, but is need to receive remote push notifications)
    senderID: "250697568790",

    // Should the initial notification be popped automatically
    // default: true
    popInitialNotification: true,

    /**
     * (optional) default: true
     * - Specified if permissions (ios) and token (android and ios) will requested or not,
     * - if not, you must call PushNotificationsHandler.requestPermissions() later
     */
    requestPermissions: true,
  })
}

// function notify(txt){
//   PushNotification.localNotification({
//     ignoreInForeground: true,
//     message: txt, // (required)
//     playSound: false, // (optional) default: true
//     soundName: "default",
//   })
// }