import { useEffect, useState, useRef } from 'react';
import { Button, Box, Container, VStack, Input, HStack } from '@chakra-ui/react';
import Message from './components/ui/Message'
import { onAuthStateChanged, getAuth, GoogleAuthProvider, signInWithPopup, signOut} from 'firebase/auth'
import {app} from './firebase'
import {getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy} from 'firebase/firestore'

const auth= getAuth(app);
const db= getFirestore(app);
const loginHandler= ()=>{
  const provider= new GoogleAuthProvider();
  signInWithPopup(auth, provider);
}

const logoutHandler= ()=>{
    signOut(auth);
}

function App() {
  const [user, setUser]= useState(false);
  const [message, setMessage]= useState("");
  const [messages, setMessages]= useState([]);
  const q = query(collection(db, "Messages"), orderBy("createdAt", "asc"));

  const divForScroll= useRef(null);

  const submitHandler = async (e)=>{
   e.preventDefault();
   try{
       setMessage("");
       await addDoc(collection(db, "Messages"), {
          text: message,
          uid: user.uid,
          uri: user.photoURL,
          createdAt: serverTimestamp(),
       });
     setMessage("");
    divForScroll.current.scrollIntoView( {behavior: "smooth"})
  }
  catch(error) {
         alert(error);
  }
}
   useEffect(()=>{
    const unsubscribe=  onAuthStateChanged(auth, (data)=>{
        setUser(data);
      });

    const unsubscribeForMessage= 
      onSnapshot(q,(snap) =>{
       setMessages(
        snap.docs.map( (item)=> {
         const id= item.id;
         return { id, ...item.data() };
       })
      ) ;
     });

      return ()=>{
        unsubscribe();
        unsubscribeForMessage();
      }
    },[]);

  return (
     <Box bg="red.100">
      {
        user ? (
          <Container bg="white" h="100vh" w="400px">
          <VStack h="full" bg="blue.300" padding="4">
          <Button w="full" bg="blue.500" onClick={logoutHandler}>
            Logout
          </Button>
       
        <VStack h="full" bg="purple.100" w="full" overflowY="auto">
         {
         messages.map((val)=>(
           <Message key={val.id}
            text= {val.text} 
            uri={val.uri} 
            user={val.uid === user.uid ? "me": "other"} />
         ))
        }
         
          <div ref={divForScroll}></div>
        </VStack>
       
          <form style={{width: "100%"}} onSubmit={submitHandler}>
            <HStack>
               <Input value={message} onChange={(e)=> setMessage(e.target.value)} variant="subtle" placeholder="Your message"/>
               <Button type="submit" bg="purple">Send</Button>
            </HStack>
           
          </form>
       
       </VStack>
      </Container>
        ) : 
        <VStack h="100vh" justifyContent="center" >
          <Button bg="red.600" onClick={loginHandler}>Sign In With Google</Button>
        </VStack>
      }
    
     </Box>
   
  );
}

export default App;