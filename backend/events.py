import redis as pyredis
from typing import Callable
from fastapi import FastAPI
import threading
from connections import manager
import asyncio
import config
import json


class Listener(threading.Thread):
    def __init__(self, r, channels):
        threading.Thread.__init__(self)
        self.redis = r
        self.pubsub = self.redis.pubsub()
        self.pubsub.subscribe(channels)

    def work(self, item):
        asyncio.run(manager.broadcast(item.get("data")))

    def run(self):
        for item in self.pubsub.listen():
            self.work(item)


async def create_redis(db: int = 0):
    """
    redis pool connection creater
    :return:
    """

    redis = pyredis.Redis(
        host=config.REDIS_HOST,
        port=config.REDIS_PORT,
        password=config.REDIS_PASSWORD,
        decode_responses=True,
    )
    client = Listener(redis, [config.CHANNEL_NAME])
    client.start()
    return redis


def create_start_app_handler(app: FastAPI) -> Callable:  # type: ignore
    async def start_app() -> None:
        app.redis = await create_redis()

    return start_app


def create_stop_app_handler(app: FastAPI) -> Callable:  # type: ignore
    async def stop_app() -> None:
        await app.redis.close()

    return stop_app
