"use client"

import { useContext, createContext, useState, useEffect } from 'react'

type WebSocketContextType={
    socket: WebSocket | null
    user:string[],
    setUser:(user:string[])=>void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {

    const [socket, setSocket] = useState<WebSocket | null>(null)
    const [user, setUser] = useState<string[]>([]);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:4000')

        ws.onopen = () => setSocket(ws)
        ws.onclose = () => console.log("WebSocket Disconnected");
        ws.onerror = (error) => console.error(" WebSocket Error:", error);

        return () => ws.close()

    }, [])

    return (
        <WebSocketContext.Provider value={{ socket,user,setUser }}>
            {children}
        </WebSocketContext.Provider>
    )
}

export const useWebSocket = () => {
    const context = useContext(WebSocketContext)
    if (!context) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }
    return context
}