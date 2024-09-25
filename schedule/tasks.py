import logging
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramBadRequest
from django.utils import timezone
from celery import shared_task
import pytz
import asyncio
from schedule.telegram import chat_id
from schedule.models import Message
from schedule.services import get_objs_disable_false, get_random_cat_photo_with_text, calculate_last_disable_dates, \
    calculate_last_disable_dates_sync, make_message_content
from schedule.telegram import bot
from asgiref.sync import sync_to_async

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


@shared_task
def update_exit_field():
    kiev_tz = pytz.timezone('Europe/Kiev')

    day_today = timezone.now().astimezone(kiev_tz)

    latest_dates = calculate_last_disable_dates_sync()

    if latest_dates:
        # Update the exit date for the latest dates
        latest_dates.update(exit=day_today)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_message_to_work_group(self):
    async def async_send_message():
        try:
            logger.info("Starting the process of sending a message to the work group.")
            try:
                message = await sync_to_async(lambda: Message.objects.all().last())()

                if message:
                    await bot.delete_message(chat_id=message.chat_id, message_id=message.message_id)
            except TelegramBadRequest:
                pass

            latest_dates = await calculate_last_disable_dates()

            resized_photo = await get_random_cat_photo_with_text()
            logger.info("Obtained a random cat photo with text.")

            if resized_photo is None:
                logger.error("Could not fetch cat photo. Retrying...")
                # If photo is None, retry the task using Celery's retry mechanism
                self.retry(exc=Exception("Failed to fetch photo"), countdown=60)
                return

            list_of_tuples = await sync_to_async(lambda: get_objs_disable_false(latest_dates))()
            logger.info("Fetched list of tuples: %s", list_of_tuples)

            message_content = await make_message_content(list_of_tuples)
            logger.info("Generated message content: %s", message_content)

            sent_message = await bot.send_photo(
                chat_id=chat_id,
                photo=resized_photo,
                caption=message_content,
                parse_mode=ParseMode.MARKDOWN
            )

            await Message.objects.acreate(chat_id=chat_id, message_id=sent_message.message_id)

            logger.info("Message successfully sent to the Telegram group.")
        except Exception as e:
            logger.error("An error occurred while sending the message: %s", str(e))
            raise

    # Use existing or create a new event loop
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    loop.run_until_complete(async_send_message())
