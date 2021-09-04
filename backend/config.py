from starlette.config import Config

config = Config(".env")

CHANNEL_NAME = config("CHANNEL_NAME", default="LIVECHAT")
REDIS_HOST = config("REDIS_HOST", default="localhost")
REDIS_PASSWORD = config("REDIS_PASSWORD", default=None)
REDIS_DB = config("REDIS_DB", cast=int, default=0)
REDIS_PORT = config("REDIS_PORT", cast=int, default=6379)
