import { InfiniteData, MutationFunction, QueryFunction, QueryKey } from "react-query"
import { queryClient } from "./queryClient";

import { io } from "socket.io-client";
const socket = io("http://localhost:8080");

socket.connect();
export interface ChatMessage {
    sender: number;
    problemId: number;
    text: string;
    createdAt?: Date;
}

const PER_PAGE = 20;

let allMessages: ChatMessage[] = [
    {
        problemId:1,
        sender:11,
        text:"hello from 11",
        createdAt: new Date()
    },
    {
        problemId:1,
        sender:22,
        text:"hello from 22",
        createdAt: new Date()
    }
]

const sendMessage: MutationFunction<any, ChatMessage> = async (message) => {
    console.log(`sendMessage: ${message}`);
    console.log(message);

    socket.emit('NEW_MESSAGE', {
        sender: message.sender,
        problemId: message.problemId,
        text: message.text,
        createdAt: Date.now()
    })

    // allMessages.push(message);
    // This supposed to triggered on receive
    // const key = ["messages", message.roomId];
    // addMessageToQueryCache(key, message);
}

const getMessages: QueryFunction<ChatMessage[]> = async (key) => {
    const roomId = key.queryKey[1];
    let date = new Date();
    if (key.pageParam) {
        date = key.pageParam;
    }
    return allMessages;
}

const hasMessageBefore = async (roomId: string, date?: Date) => {
    if (!date) {
        return false;
    }
    // const data = await db.collection(`Chats/${roomId}/messages`).orderBy("createdAt", "desc").where("createdAt", "<", date).limit(1).get()
    // return !!data.docs.length;
    return true;
}

const attachMessageListener = (key: QueryKey): () => void => {
    const roomId = key[1];
    return () => {
        console.log(roomId);
        socket.on("NEW_MESSAGE", (response) => {
            console.log(response);
        });
        // Receive from websocket and add to query cache
        // addMessageToQueryCache(key, response);
    }
}

const addMessageToQueryCache = (key: QueryKey, message: ChatMessage) => {
    const cache = queryClient.getQueryData<InfiniteData<ChatMessage[]>>(key);
    const messages = cache?.pages.flat() || [];
    messages.unshift(message);

    const newData: ChatMessage[][] = [];
    for (let i = 0; i < messages.length; i += PER_PAGE) {
        const currentPage = messages.slice(i, i + PER_PAGE);
        newData.push(currentPage);
    }

    queryClient.setQueryData<InfiniteData<ChatMessage[]>>(key, data => {
        return {
            pageParams: data?.pageParams || [],
            pages: newData,
        }
    })
}

export const chatService = {
    sendMessage,
    getMessages,
    attachMessageListener,
    PER_PAGE,
    hasMessageBefore,
}