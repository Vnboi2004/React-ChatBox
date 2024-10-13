import React, { useState } from 'react'
import './Login.css'
import { toast } from 'react-toastify'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../../lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import upload from '../../lib/upload'

const Login = () => {
    // Initialize
    const [avatar, setAvatar] = useState({
        file: null,
        url: ''
    })
    
    const [loading, setLoading] = useState(false);

    // Xử lý sự kiện chọn hình ảnh ảnh đại diện
    const handleAvatar = (e) => {
        // e.target.files[0]: lấy tệp đầu tiên mà người dùng đã chọn.
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0]) // tạo ra một URL tạm thời để hiển thị hình ảnh đã chọn trước khi người dùng gửi biểu mẫu
            })
        }
    }

    // Xử lý sự kiện user Register
    const handleRegister = async (e) => {
        e.preventDefault(); // cho phép bạn xử lý dữ liệu form mà không cần tải lại trang.
        setLoading(true);
        const formData = new FormData(e.target); // Lấy tất cả dữ liệu từ form dựa trên sự kiện submit
        const {username, email, password} = Object.fromEntries(formData); // chuyển đổi FormData -> Object sau đó gán dữ liệu
        
        try {
            // Trả về result.user với thuộc tính uid
            const result = await createUserWithEmailAndPassword(auth, email, password);
            
            const imgUrl = await upload(avatar.file)

            // Lưu dữ liệu người dùng vào Firestore được lưu trong một document với uid
            await setDoc(doc(db, 'users', result.user.uid), {
                username,
                email,
                avatar: imgUrl,
                id: result.user.uid,
                blocked: [], // Một mảng rỗng đại diện cho danh sách người dùng bị chặn (nếu có).
            });

            // Lưu dữ liệu chat user
            await setDoc(doc(db, 'userchats', result.user.uid), {
                chats: [],
            });

            toast.success('Sign up successfully');
        } catch (err) {
            console.log(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }


    // Xử lý sự kiện user Login
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target); 
        const {email, password} = Object.fromEntries(formData); 

        try {
            await signInWithEmailAndPassword(auth, email, password);

        } catch (err) {
            console.log(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='login'> 
            <div className="item">
                <h2>Welcome back,</h2>
                <form onSubmit={handleLogin}>
                    <input type="text" placeholder='Email' name='email'/>
                    <input type="password" placeholder='Password' name='password'/>
                    <button disabled={loading}>{loading ?  'Loading' : 'Sign In'}</button>
                </form>
            </div>
            <div className="separator"></div>
            <div className="item">    
                <h2>Create an Account</h2>
                <form onSubmit={handleRegister}>
                    <label htmlFor="file">
                        <img src={avatar.url || './img/avatar.png'} alt="" />
                        Up load an image
                    </label>
                    <input 
                        id='file' 
                        type='file'
                        style={
                            {display: 'none'}
                        } 
                        onChange={handleAvatar}
                    />
                    <input type="text" placeholder='Username' name='username'/>
                    <input type="text" placeholder='Email' name='email'/>
                    <input type="password" placeholder='Password' name='password'/>
                    <button disabled={loading}>{loading ?  'Loading' : 'Sign Up'}</button>
                </form>
            </div>
        </div>
    )
}

export default Login
