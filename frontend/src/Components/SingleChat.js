import React, { useEffect, useState } from 'react'
import { ChatState } from "../Context/ChatProvider";
import { Box, Text } from "@chakra-ui/layout";
import { IconButton, Spinner, useToast, FormControl, Input } from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal"
import UpdateGroupChatModal from './miscellaneous/UpdateGroupChatModal';
import axios from "axios";
import ScrollableChat from "./ScrollableChat";
import "./styles.css";
import io from "socket.io-client";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";

const ENDPOINT = "http://localhost:5000";
var socket, selectedChatCompare;


function SingleChat({ fetchAgain, setFetchAgain }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing, setTyping] = useState(false);
    const [istyping, setIsTyping] = useState(false);
    const toast = useToast();
    const { selectedChat, setSelectedChat, user, notification, setNotification} = ChatState();


    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid slice",
        },
      };

    const fetchMessages = async () => {
        if (!selectedChat) {
            return;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            setLoading(true);
            
            const { data } = await axios.get(
                `/api/message/${selectedChat._id}`,
                config
            );

           
            setMessages(data);
            setLoading(false);
          
            socket.emit("join chat",selectedChat._id)


        } catch (error) {
            toast({
                title: "Error Occured!",
                description: "Failed to Load the Messages",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
        }
    }

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
        socket.on("connected", () => setSocketConnected(true));
        socket.on("typing", () => setIsTyping(true));
        socket.on("stop typing", () => setIsTyping(false));
    }, []);

    useEffect(() => {
        
        fetchMessages()
        selectedChatCompare = selectedChat;
    }, [selectedChat])

    

   //it will run when state chenges not an normal useEffect
   useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        // give notification

        if (!notification.includes(newMessageRecieved)) {
           
            setNotification([newMessageRecieved, ...notification]);
            
            setFetchAgain(!fetchAgain);
          }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

    const sendMessage = async (event) => {
        socket.emit("stop typing", selectedChat._id);
        if (event.key === "Enter" && newMessage)//event.key==="Enter" checks Enter key pressed or not
        {
            try {
                const config = {
                    headers: {
                        "Content-type": "application/json",
                        Authorization: `Bearer ${user.token}`,
                    },
                };

                setNewMessage("")

                const { data } = await axios.post(
                    "/api/message",
                    {
                        content: newMessage,
                        chatId: selectedChat._id,
                    },
                    config
                );

                
                socket.emit("new message",data)
                setMessages([...messages, data])


            } catch (error) {

                toast({
                    title: "Error Occured!",
                    description: "Failed to send the Message",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom",
                });
            }

        }

    }
   
    const typingHandler = (e) => {
       
        setNewMessage(e.target.value)
        //typing indicator logic
        if(!socketConnected)
        {
            return;
        }

        
        if(!typing)
        {
            setTyping(true)
            socket.emit('typing',selectedChat._id)
        }

        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;

        setTimeout(() => {

          var timeNow = new Date().getTime();
          var timeDiff = timeNow - lastTypingTime;

      

          if (timeDiff >= timerLength && typing) {
            socket.emit("stop typing", selectedChat._id);
            setTyping(false);
          }

        }, timerLength);


    }


    return (

        <>
            
            {selectedChat ? (
                <>
                    <Text
                        fontSize={{ base: "28px", md: "30px" }}
                        pb={3}
                        px={2}
                        width="100%"
                        fontFamily="Work sans"
                        display="flex"
                        justifyContent={{ base: "space-between" }}
                        alignItems="center"
                    >
                        <IconButton
                            display={{ base: "flex", md: "none" }}
                            icon={<ArrowBackIcon />}
                            onClick={() => setSelectedChat("")}
                        />

                        {!selectedChat.isGroupChat ? (
                            <>

                                {getSender(user, selectedChat.users)}  {/* user means logged in user*/}
                                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                            </>
                        ) : (
                            <>
                                {selectedChat.chatName.toUpperCase()}
                                <UpdateGroupChatModal
                                    fetchAgain={fetchAgain}
                                    setFetchAgain={setFetchAgain}
                                    fetchMessages={fetchMessages}
                                />
                            </>

                        )}

                    </Text>

                    <Box
                        display="flex"
                        flexDir="column"
                        justifyContent="flex-end"
                        p={3}
                        bg="#E8E8E8"
                        w="100%"
                        h="100%"
                        borderRadius="lg"
                        overflowY="hidden"
                    >

                        {loading ? (<Spinner
                            size="xl"
                            w={20}
                            h={20}
                            alignSelf="center"
                            margin="auto"
                        />) : (
                            <div>
                                <div className="messages">
                                    <ScrollableChat messages={messages} />
                                </div>
                            </div>)}

                        <FormControl
                            onKeyDown={sendMessage} // onKeyDown use when we press enter key in input  box of message then message  should be send 
                            id="first-name"
                            isRequired
                            mt={3}
                        >

                          {istyping?<div><Lottie options={defaultOptions}
                    // height={50}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}/></div>:(<></>)}
                            <Input
                                variant="filled"
                                bg="#E0E0E0"
                                placeholder="Enter a message.."
                                value={newMessage}
                                onChange={typingHandler}//passing event to typingHandler
                            />
                        </FormControl>


                    </Box>
                </>
            ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Text fontSize="3xl" pb={3} fontFamily="Work sans">
                        Click on a user to start chatting
                    </Text>
                </Box>
            )
            }
        </>
    )
}

export default SingleChat