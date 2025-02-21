"use client"
import React, { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useWebSocket } from '../context/WebSocketContext';


const Code = () => {
    const editorRef = useRef<any>(null);
    const [codeing, setCodeing] = useState<string>('');
    const [language, setLanguage] = useState<string>('javascript');
    const { socket,user,setUser } = useWebSocket();

    

    useEffect(() => {
        if (!socket) return;

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === "users-list") {
                setUser(data.users);
            }
            if (data.type === "code_update") {
                setCodeing(data.code);
            }
        };

        return () => {
            socket.onmessage = null; 
        };
        
    }, [socket]);

    const handleEdit = (newCode: string | undefined) => {
        if (!newCode) return;
        setCodeing(newCode);
        if (socket) {
            socket.send(JSON.stringify({ type: 'code_update', code: newCode }));
        }
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className="w-1/4 p-4 bg-gray-900 text-white flex flex-col border-r border-gray-700">
                {/* Language Selection */}
                <label className="text-sm font-semibold mb-2">Select Language</label>
                <select
                    className="w-full p-2 bg-gray-800 text-white rounded-md mb-4"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="c">C</option>
                    <option value="c++">C++</option>
                </select>

                {/* Active Users */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Active Users</h3>
                    <ul className="mt-2 space-y-2">
                        {user.map((x, i) => (
                            <li key={i} className="bg-gray-800 p-2 rounded-md">
                                {x}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Code Editor */}
            <div className="w-3/4">
                <Editor
                    height="100vh"
                    theme="vs-dark"
                    language={language}
                    value={codeing}
                    onChange={handleEdit}
                    onMount={(editor) => (editorRef.current = editor)}
                />
            </div>
        </div>
    );
};

export default Code;
