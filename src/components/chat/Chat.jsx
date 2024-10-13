import React, { useEffect, useRef, useState } from 'react'
import EmojiPicker from 'emoji-picker-react'
import './Chat.css'
import { arrayUnion, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useChatStore } from '../../lib/chatStore'
import { useUserStore } from '../../lib/userStore'
import upload from '../../lib/upload'

const Chat = () => {

  const [chat, setChat] = useState();

  // Cập nhật moused image icons
  const [open, setOpen] = useState(false);

  // Cập nhật icon
  const [text, setText] = useState('');
  const [img, setImg] = useState({
    file: null,
    url: '',
  });

  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
  const { currentUser } = useUserStore();

  // Tham chiếu phần tử hiện tại 
  const endRef = useRef(null);

  
  useEffect(() => {
    // endRef.current?: phần tử tham chiếu hiện tại và xác định phần tử đó không phải null hoặc undefined
    // scrollIntoView({behavior:"smooth"}): cuộn trang đến vị trí của phần tử đó với hiệu ứng mượt mà.
    endRef.current?.scrollIntoView({behavior:"smooth"})
  }, [chat])

  useEffect(() => {
    const unSub = onSnapshot(doc(db, 'chats', chatId), (res) => {
      setChat(res.data());
    })

    return () => {
      unSub();
    };
  }, [chatId])
  
  //  Xử lý sự kiện click chọn icons trong emoji
  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji)
    setOpen(false)
  }


  const handleSend = async () => {
    if (text === '' && !img.file) return; // Không gửi nếu không có text và không có img
    let imgUrl = null;

    try {
        if (img.file) {
            imgUrl = await upload(img.file); // Chỉ upload nếu có img.file
        }

        const newMessage = {
            senderId: currentUser.id,
            text,
            createAt: new Date(), // Sử dụng `new Date()` tạm thời
            ...(imgUrl && { img: imgUrl }), // Thêm imgUrl vào tin nhắn nếu có
        };

        // Bước 1: Thêm tin nhắn mới với `new Date()` trong mảng
        await updateDoc(doc(db, 'chats', chatId), {
            messages: arrayUnion(newMessage),
        });

        // Nếu cần chính xác từ server, bạn có thể cập nhật `createAt` riêng với `serverTimestamp()` sau này
        await updateDoc(doc(db, 'chats', chatId), {
            updateAt: serverTimestamp(),  // Cập nhật chính xác từ server
        });

        // Cập nhật thông tin chat cho user
        const userIDs = [currentUser.id, user.id];
        userIDs.forEach(async (id) => {
            const userChatsRef = doc(db, 'userchats', id);
            const userChatsSnapshot = await getDoc(userChatsRef);

            if (userChatsSnapshot.exists()) {
                const userChatsData = userChatsSnapshot.data();
                const chatIndex = userChatsData.chats.findIndex(
                    (chat) => chat.chatId === chatId
                );

                userChatsData.chats[chatIndex].lastMessage = text;
                userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true : false;
                userChatsData.chats[chatIndex].updateAt = new Date();

                await updateDoc(userChatsRef, {
                    chats: userChatsData.chats,
                });
            }
        });

        // Xóa input và ảnh sau khi gửi
        setText('');
        setImg({
            file: null,
            url: '',
        });

    } catch (error) {
        console.error(error);
    }
};

  const handleImg = (e) => {
    // e.target.files[0]: lấy tệp đầu tiên mà người dùng đã chọn.
    if (e.target.files[0]) {
        setImg({
            file: e.target.files[0],
            url: URL.createObjectURL(e.target.files[0]) // tạo ra một URL tạm thời để hiển thị hình ảnh đã chọn trước khi người dùng gửi biểu mẫu
        })
    }
}

  


  return (
    <div className='chat'>
      {/* Start Top */}
      <div className="top">
      <div className="user">
        <img src={user?.avatar || './img/avatar.png'} alt="" />
        <div className="texts">
          <span>{user ? user.username : 'Unknown User'}</span> {/* Cập nhật ở đây */}
          <p>Lorem ipsum dolor sit amet.</p>
        </div>
      </div>
        <div className="icon">
          <img src="./img/phone.png" alt="" />
          <img src="./img/video.png" alt="" />
          <img src="./img/info.png" alt="" />
        </div>
      </div>
      
      {/* Start Center */}
      <div className="center">
        { chat?.messages?.map((message) => (
          <div className={message.senderId === currentUser?.id ? 'message own' : 'message'} key={message?.createAt}>
            <div className="texts">
              {message.img &&  <img src={message.img} alt="" />}
              <p>
                {message.text}
              </p>
              {/* <span>{message}</span> */}
            </div>
          </div>
        ))
        }
        {img.url && (<div className="message own">
          <div className="texts">
            <img src={img.url} alt="" />
          </div>
        </div>)}
        <div ref={endRef}></div>
      </div>

      {/* Start Bottom */}
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img/img.png" alt="" />
          </label>
          <input type="file" id='file' style={{display:'none'}} onChange={handleImg}/>
          <img src="./img/camera.png" alt="" />
          <img src="./img/mic.png" alt="" />
        </div>
        <input 
          value={text}
          type="text" 
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? 'You can not send a message' 
              : 'Type a message...'
          }
          onChange={e => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img 
            src="./img/emoji.png" 
            alt="" 
            onClick={() => setOpen(prev => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji}/>
          </div>
        </div>
        <button className='sendButton' onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>Send</button>
      </div>
    </div>
  )
}


export default Chat
