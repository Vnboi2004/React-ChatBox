import React, { useState } from 'react'
import './AddUser.css'
import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useUserStore } from '../../lib/userStore';

const AddUser = () => {
  const [user, setUser] = useState(null);
  const {currentUser} = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    
    try {
      const userRef = collection(db, 'users');
      const q = query(userRef, where('username', '==', username));
      
      const querySnapshot = await getDocs(q);  // Use getDocs instead of getDoc

      if (!querySnapshot.empty) {
        setUser(querySnapshot.docs[0].data());
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handleAdd = async () => {
    if (!user || !currentUser) {
      console.log("User or current user not found.");
      return;
    }
  
    const chatRef = collection(db, 'chats');
    const userChatsRef = collection(db, 'userchats');
  
    try {
      const newChatRef = doc(chatRef);
      
      await setDoc(newChatRef, {
        createAt: serverTimestamp(),
        message: [],
      });
  
      const userChatDoc = doc(userChatsRef, user.id);
      const currentUserChatDoc = doc(userChatsRef, currentUser.id);
  
      // Tạo tài liệu mới cho người dùng nếu chưa tồn tại
      await Promise.all([
        setDoc(userChatDoc, { chats: [] }, { merge: true }),
        setDoc(currentUserChatDoc, { chats: [] }, { merge: true }),
      ]);
  
      // Cập nhật danh sách các cuộc trò chuyện cho người dùng
      await updateDoc(userChatDoc, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: '',
          receiverId: currentUser.id,
          // Không sử dụng serverTimestamp() ở đây
        })
      });
  
      await updateDoc(currentUserChatDoc, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: '',
          receiverId: user.id,
          // Không sử dụng serverTimestamp() ở đây
        })
      });
  
      // Cập nhật riêng trường updateAt bằng serverTimestamp() sau khi đã cập nhật chats
      await updateDoc(userChatDoc, {
        updateAt: serverTimestamp(),
      });
  
      await updateDoc(currentUserChatDoc, {
        updateAt: serverTimestamp(),
      });
  
    } catch (error) {
      console.log('Error adding chat:', error);
    }
  };
  

  return (
    <div className='addUser'>
      <form onSubmit={handleSearch}>
        <input type="text" placeholder='Username' name='username'/>
        <button>Search</button>
      </form>
      {user && <div className="user">
        <div className="detail">
            <img src={user.avatar || "./img/avatar.png"} alt="" />
            <span>{user.username}</span>
        </div>
        <button onClick={handleAdd}>Add User</button>
      </div>}
    </div>
  )
}

export default AddUser
