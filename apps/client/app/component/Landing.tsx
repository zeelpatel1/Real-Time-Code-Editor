"use client"

import { useEffect, useState } from "react"
import { useWebSocket } from "../context/WebSocketContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

export default function Landing() {
    const [roomNo, setRoomNo] = useState("")
    const [password, setPassword] = useState("")
    const [email, setEmail] = useState("")
    const [emailPsw, setEmailPsw] = useState("")
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(true)
    const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false)
    const [newRoomNo, setNewRoomNo] = useState("")
    const [newPassword, setNewPassword] = useState("")

    const router = useRouter()
    const { socket, setUser} = useWebSocket()

    useEffect(() => {
        if (!socket) return

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data)
            if (data.type === "users-list") {
                setUser(data.users)
            }
            if (data.status === "success") {
                router.push('/editor')
            }
        }
    }, [socket])

    const handleAuthSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !emailPsw) return
        setIsAuthModalOpen(false)
    }

    const handleRoomSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (socket) {
            socket.send(JSON.stringify({ type: "join-room", roomNo, password, email, emailPsw }))
        }
    }

    const handleCreateRoomSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (socket) {
            socket.send(JSON.stringify({ type: "create-room", roomNo: newRoomNo, password: newPassword }))
            setIsCreateRoomModalOpen(false)
        }
    }

    return (
        <>
            {/* Non-dismissible Authentication Modal */}
            <Dialog open={isAuthModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enter Your Email & Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAuthSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="emailPsw">Password</Label>
                            <Input id="emailPsw" type="password" value={emailPsw} onChange={(e) => setEmailPsw(e.target.value)} required />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={!email || !emailPsw}>
                                Continue
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Non-dismissible Create Room Modal */}
            <Dialog open={isCreateRoomModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a Room</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateRoomSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="newRoomNo">Room Number</Label>
                            <Input id="newRoomNo" type="text" value={newRoomNo} onChange={(e) => setNewRoomNo(e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="newPassword">Password</Label>
                            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={!newRoomNo || !newPassword}>
                                Create Room
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Main Room Form (Only visible after authentication) */}
            {!isAuthModalOpen && (
                <div className="flex flex-col items-center justify-center min-h-screen w-full space-y-4">
                    <form onSubmit={handleRoomSubmit} className="w-full max-w-md space-y-4">
                        <div>
                            <Label htmlFor="roomNo">Room Number</Label>
                            <Input id="roomNo" type="text" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <Button type="submit" className="w-full" disabled={!roomNo || !password}>
                            Join Room
                        </Button>
                    </form>
                    <Button variant="outline" onClick={() => setIsCreateRoomModalOpen(true)}>
                        Create Room
                    </Button>
                </div>
            )}
        </>
    )
}
