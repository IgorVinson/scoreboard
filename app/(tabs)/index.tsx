import {useEffect, useState} from 'react'
import {supabase} from '@/utils/supabase'
import AuthScreen from '@/screens/AuthScreen'
import Account from '@/screens/Account'
import {View} from 'react-native'
import {Session} from '@supabase/supabase-js'

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <View>
      {session && session.user ? <Account key={session.user.id} session={session} /> : <AuthScreen />}
    </View>
  )
}





//
//
//
// import {StyleSheet} from 'react-native';
// import ParallaxScrollView from '@/components/ParallaxScrollView';
// import {ThemedView} from '@/components/ThemedView';
// import AuthScreen from "@/screens/AuthScreen";
//
// export default function HomeScreen() {
//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}>
//       <ThemedView style={styles.container}>
//         <AuthScreen />
//       </ThemedView>
//     </ParallaxScrollView>
//   );
// }
//
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 16,
//   },
// });