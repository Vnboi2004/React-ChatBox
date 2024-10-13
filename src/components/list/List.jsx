import React from 'react'
import Useinfo from './useInfo/UseInfo'
import ChatList from './chatList/ChatList'
import './List.css'


const List = () => {
  return (
    <div className='list'>
      <Useinfo/>
      <ChatList/>
    </div>
  )
}

export default List
