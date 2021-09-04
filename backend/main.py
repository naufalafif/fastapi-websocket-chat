from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Cookie, Query, Depends, status
from typing import Optional
from connections import manager
from events import create_start_app_handler, create_stop_app_handler
import config
from pydantic import BaseModel, HttpUrl


app = FastAPI()
app.add_event_handler("startup", create_start_app_handler(app))
app.add_event_handler("shutdown", create_stop_app_handler(app))

class Message(BaseModel):
    message: str
    profile_picture: HttpUrl
    user: str


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, user: str, profile_picture: str):

    if user: 
        try:
            await manager.connect(websocket)
            message_to_broadcast = Message(
                message=f"{user} join the chat",
                user=user,
                profile_picture=profile_picture
            )
            await manager.broadcast(message_to_broadcast.json())
            while True:
                data = await websocket.receive_text()
                message = Message(
                    message=data,
                    user=user,
                    profile_picture=profile_picture
                )
                
                app.redis.publish(config.CHANNEL_NAME, message.json())
        except WebSocketDisconnect:
            manager.disconnect(websocket)
            message = Message(
                message=f"{user} left the chat",
                user=user,
                profile_picture=profile_picture
            )
            await manager.broadcast(message.json())
