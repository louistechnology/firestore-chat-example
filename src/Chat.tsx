import dayjs from 'dayjs';
import React, { FormEvent, useEffect } from 'react'
import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from 'react-query';
import { Bubble } from './Bubble'
import { chatService } from './chatService';

interface ChatProps {
    onBackPress: () => void;
    chatState: ChatState;
}

interface ChatState {
    username: string;
    room_id: string;
}

export const Chat: React.FC<ChatProps> = ({
    onBackPress,
    chatState,
}) => {

    const roomId = chatState.room_id;
    const queryKey = ["messages", roomId];

    const [message, setMessage] = useState();
    const [hasNextPage, setHasNextPage] = useState(false);

    const sendMutation = useMutation(chatService.sendMessage, {
        onMutate: () => {
            setMessage()
        },
    });

    const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (message.trim()) {
            sendMutation.mutate({
                sender: message.sender,
                problemId: message.roomId,
                text: message.text,
                createdAt: Date.now()
            })
        }
    }

    const { data, fetchNextPage } = useInfiniteQuery(queryKey, chatService.getMessages, {
        getNextPageParam: (lp) => {
            if (lp.length) {
                return lp?.[lp.length - 1].createdAt;
            }
        }
    });

    useEffect(() => chatService.attachMessageListener(queryKey), [roomId])

    const flatData = data?.pages.flat() || []
    const lastDate = flatData?.[flatData.length - 1]?.createdAt;

    useEffect(() => {
        const getNextPage = async () => {
            const np = await chatService.hasMessageBefore(roomId, lastDate);
            setHasNextPage(np);
        }
        if (lastDate && roomId) {
            getNextPage()
        }
    }, [lastDate, roomId])

    return (
        <>
            <div className="w-screen px-5 flex flex-row items-center justify-between border-solid border-b-2 border-blue-100">
                <a className="bg-gray-200 p-2 rounded hover:bg-gray-300 cursor-pointer" onClick={onBackPress}>⬅️ Back</a>
                <h1 className="text-lg ml-5 font-bold font-mono my-5">🔥 Help Me 💬 </h1>
            </div>
            <div className="w-screen flex-1 flex flex-col-reverse overflow-auto px-10">
                {
                    data?.pages.flat().map((data) => <Bubble right={chatState.username === data.username} username={data.username} time={dayjs(data.createdAt).format("HH:mm")} message={data.text} key={data.id} />)
                }
                {
                    hasNextPage && (
                        <div className="flex self-center my-2">
                            <a className="ease transition-all delay-75 bg-gray-600 text-center text-sm text-white rounded-full p-2 px-5 cursor-pointer hover:bg-gray-800" onClick={() => fetchNextPage()}>Earlier messages</a>
                        </div>
                    )
                }
            </div>
            <form className="mx-auto w-screen flex p-10" onSubmit={handleSendMessage}>
                <input value={message} className="flex-1 appearance-none border border-transparent w-full py-2 px-4 bg-white text-gray-700 placeholder-gray-400 shadow-md rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent rounded-r-none" onChange={({ target: { value } }) => setMessage(value)} placeholder="Message..." />
                <input type="submit" value="Send" className={`transition-all delay-300 ease flex-shrink-0 text-white text-base font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-200 rounded-l-none bg-purple-600`} />
            </form>
        </>
    )
}
