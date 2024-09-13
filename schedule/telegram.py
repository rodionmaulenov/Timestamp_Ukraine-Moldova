from aiogram import Bot, Dispatcher
import asyncio
import logging
import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
chat_id = os.environ.get('CHAT_ID')

bot = Bot(token=TELEGRAM_BOT_TOKEN)
dp = Dispatcher()


async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
