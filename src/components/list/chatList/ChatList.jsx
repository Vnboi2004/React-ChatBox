import React, { useEffect, useState } from 'react'
import './ChatList.css'
import AddUser from '../../addUser/AddUser'
import { useUserStore } from '../../../lib/userStore'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { useChatStore } from '../../../lib/chatStore'

const ChatList = () => {
  const [addMore, setAddMore] = useState(false);
  const [input, setInput] = useState('');
  const [chats, setChats] = useState([]);  
  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();
  
  useEffect(() => {
    if (!currentUser?.id) return; // Check if currentUser is loaded
    
    const unsub = onSnapshot(doc(db, 'userchats', currentUser.id), async (res) => {
      const items = res.data()?.chats || []; // Ensure that chats exists
      
      const promises = items.map(async (item) => {
        const userDocRef = doc(db, 'users', item.receiverId);
        const userDocSnap = await getDoc(userDocRef);
        
        const user = userDocSnap.data();
        return { ...item, user };
      });

      const chatData = await Promise.all(promises);
      setChats(chatData.sort((a, b) => b.updateAt - a.updateAt));
    });

    return () => {
      unsub();
    };
  }, [currentUser.id]);


  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest} = item;
      return rest;
    });
    
    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    )

    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, 'userchats', currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (error) {
      console.log(error);
    }

  }

  const filterdChats = chats.filter((chat) => chat.user.username.toLowerCase().includes(input.toLowerCase())); 

  return (
    <div className='chatList'>
      <div className="search">
        <div className="searchBar">
          <img src="./img/search.png" alt="search" />
          <input type="text" placeholder='Search' onChange={(e) => setInput(e.target.value)}/>
        </div>
        <img 
          src={addMore ? "./img/minus.png" : "./img/plus.png"} 
          alt="toggle add user" className='add'
          onClick={() => setAddMore(prev => !prev)}
        />
      </div>

      {(
        filterdChats.map((chat) => (
          <div 
          className="item" 
          key={chat.chatId} 
          onClick={() => handleSelect(chat)} 
          style={{
            backgroundColor: chat?.isSeen ? 'transparent' : '#5183fe',
          }} 
          >
            <img src=
              {chat.user.blocked.includes(currentUser.id) 
              ? './img/avatar.png' 
              : chat.user.avatar || "./img/avatar.png"} 
              alt="user avatar" 
            />
            <div className="texts">
              <span>
                {
                  chat.user.blocked.includes(currentUser.id) 
                  ? 'User' 
                  : chat.user.username
                }
              </span> {/* Show user name */}
              <p>{chat.lastMessage}</p>
            </div>
          </div>
        ))
      )}

      {addMore && <AddUser />}
    </div>
  );
};

export default ChatList;
