import logging
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramBadRequest, TelegramRetryAfter
from django.db import transaction
from django.utils import timezone
import hashlib
from celery import shared_task
import pytz
from datetime import timedelta, datetime
import asyncio
from schedule.telegram import chat_id
from schedule.models import Message, SurrogacyMother
from schedule.services import get_objs_disable_false, get_random_cat_photo_with_text, calculate_last_disable_dates_sync, \
    make_message_content, get_last_message, delete_last_message, calculate_dates
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

    with transaction.atomic():
        latest_dates = calculate_last_disable_dates_sync()

        if latest_dates:
            # Update the exit date for the latest dates
            latest_dates.update(exit=day_today)

        mothers = SurrogacyMother.objects.all()

        updates = []

        for mother in mothers:
            days_left, _ = calculate_dates(mother, timezone.now(), country=mother.country)

            if mother.days_left != days_left:
                if isinstance(days_left, datetime):
                    days_left = days_left.isoformat()
                    mother.days_left = days_left
                    updates.append(mother)

        # Perform bulk update of SurrogacyMother objects
        if updates:
            SurrogacyMother.objects.bulk_update(updates, ['days_left'])


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_message_to_work_group(self):
    async def async_send_message():
        try:
            logger.info("Starting the process of sending a message to the work group.")

            # Fetch the last sent message from the database
            last_message = await sync_to_async(get_last_message)()

            # If there is a previous message, delete it from the Telegram group and the database
            if last_message:
                try:
                    await bot.delete_message(chat_id=last_message.chat_id, message_id=last_message.message_id)
                    logger.info("Deleted previous message from the chat.")
                except TelegramBadRequest:
                    logger.warning("Failed to delete the previous message from Telegram.")

                # Delete the last message from the database
                await sync_to_async(delete_last_message)(last_message)
                logger.info("Deleted previous message from the database.")


            # Create the message content
            latest_dates = await sync_to_async(calculate_last_disable_dates_sync)()
            list_of_tuples = await sync_to_async(get_objs_disable_false)(latest_dates)

            message_content = await make_message_content(list_of_tuples)

            message_hash = hashlib.sha256(message_content.encode()).hexdigest()

            one_hour_ago = timezone.now() - timedelta(hours=1)
            existing_message = await sync_to_async(lambda: Message.objects.filter(
                message_hash=message_hash,
                timestamp__gte=one_hour_ago
            ).exists())()

            if existing_message:
                logger.info("Duplicate message detected, skipping sending.")
                return

            # Obtain and send the cat photo
            resized_photo = await get_random_cat_photo_with_text()
            if resized_photo is None:
                logger.error("Could not fetch cat photo. Retrying...")
                self.retry(exc=Exception("Failed to fetch photo"), countdown=60)
                return

            sent_message = await bot.send_photo(
                chat_id=chat_id,
                photo=resized_photo,
                caption=message_content,
                parse_mode=ParseMode.MARKDOWN
            )

            await Message.objects.acreate(
                chat_id=chat_id,
                message_id=sent_message.message_id,
                message_hash=message_hash,
            )

            logger.info("Message successfully sent to the Telegram group.")

        except TelegramRetryAfter as e:
            # Handle Telegram's rate-limiting
            retry_after = e.retry_after
            logger.warning(f"Telegram rate limit exceeded, retrying in {retry_after} seconds.")
            self.retry(countdown=retry_after)

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
