from aiogram import Bot, Dispatcher
import asyncio
import logging

TELEGRAM_BOT_TOKEN = '6911204778:AAGjU6RvUWK8eNmvsFRF6CpuLBYlNMzSqMw'
chat_id = '-1002171039112'

bot = Bot(token=TELEGRAM_BOT_TOKEN)
dp = Dispatcher()


async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
