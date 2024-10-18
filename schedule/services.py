import logging
from typing import Union, Optional
import pytz
from datetime import timedelta, datetime
from django.utils import timezone as django_timezone
from django.db import transaction
from django.db.models import OuterRef, Subquery, QuerySet
from aiogram.types import BufferedInputFile
from schedule.models import Date, Message, SurrogacyMother
from PIL import Image
from io import BytesIO
import aiohttp
import random

# Set up logging globally
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

logger = logging.getLogger(__name__)


async def get_random_cat_photo_with_text():
    logger.info("Fetching a random cat photo with text.")

    hello_texts = ["Kairat kogda v office?", "Hello", "Bonjour", "Привет", "ПивПив", "МяоКокао", "Raxmat Shimkentskie",
                   "Bolshe Valericha", "Chistim zybu", "Xvatit boltat", "Alo garag", "Parvana sroki goryat",
                   "Ainura i gdu UZI", "Gad idi suda"]

    colors = ["yellow", "white", "orange", "pink"]

    font_size = 65
    font_color = random.choice(colors)
    hello_text = random.choice(hello_texts)

    url = f"https://cataas.com/cat/says/{hello_text}?fontSize={font_size}&fontColor={font_color}"

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    img_data = await response.read()
                    image = Image.open(BytesIO(img_data))

                    if image.mode == 'RGBA':
                        image = image.convert('RGB')

                    target_width = 400
                    target_height = 300
                    resized_image = image.resize((target_width, target_height))

                    img_byte_arr = BytesIO()
                    resized_image.save(img_byte_arr, format='JPEG')
                    img_byte_arr.seek(0)

                    input_file = BufferedInputFile(img_byte_arr.read(), filename='cat_photo.jpg')
                    logger.info("Successfully fetched and resized the cat photo.")
                    return input_file
                else:
                    logger.error("Failed to fetch the photo. Status code: %s", response.status)
        except Exception as e:
            logger.error("An error occurred while fetching the cat photo: %s", str(e))
            raise


def calculate_dates(instance, control_date, pre_fetched_dates=None, country=None, last_equal_control_date=False):
    if pre_fetched_dates is not None and country is not None:
        raise ValueError("You cannot use 'country' when 'pre_fetched_dates' is provided.")

    kiev_tz = pytz.timezone('Europe/Kiev')

    # Convert control_date to a timezone-aware datetime object in Kiev timezone
    control_date = kiev_tz.localize(datetime.combine(control_date, datetime.min.time()))

    # Calculate the start of the 180-day period at midnight in Kiev timezone
    beginning_180_days = control_date - timedelta(days=179)

    # Initialize total days stayed within the 180-day window
    total_days_stayed = 0

    if pre_fetched_dates is not None:
        dates = [date for date in pre_fetched_dates
                 if date.entry <= control_date.date() and date.exit >= beginning_180_days.date()]
    else:
        dates = list(Date.objects.filter(
            surrogacy_id=instance.id,
            entry__lte=control_date.date(),
            exit__gte=beginning_180_days.date(),
            country=instance.country if country is None else country
        ).only('entry', 'exit').iterator(chunk_size=50))

    for i, date in enumerate(dates):

        entry_date = kiev_tz.localize(datetime.combine(date.entry, datetime.min.time()))
        exit_date = kiev_tz.localize(datetime.combine(date.exit, datetime.min.time()))

        # For all dates except the last one, adjust the exit_date based on control_date
        if i == len(dates) - 1 and last_equal_control_date:  # If this is the last date
            exit_date = control_date  # Set exit date to control date
        else:
            # Adjust entry_date and exit_date to fit within the 180-day period
            entry_date = max(entry_date, beginning_180_days)
            exit_date = min(exit_date, control_date)

        # Calculate the stay duration
        stay_duration = max(1, (exit_date - entry_date).days + 1)

        # Accumulate the total days stayed
        total_days_stayed += stay_duration

    # Calculate days left inclusively
    days_left = 90 - total_days_stayed

    return days_left, total_days_stayed


def get_date_or_str(value: Union[datetime.date, str]) -> Union[int, str]:
    if isinstance(value, str):
        return value

    kiev_tz = pytz.timezone('Europe/Kiev')
    localize_date_today = django_timezone.now().astimezone(kiev_tz).date()
    date_when_15_days_left = value
    days_difference = (localize_date_today - date_when_15_days_left).days

    if date_when_15_days_left > localize_date_today:
        return 16
    elif days_difference > 15:
        return -(days_difference - 15)
    elif days_difference == 15:
        return 15
    elif days_difference < 15:
        return 15 - days_difference


def format_date(date_value: datetime.date) -> str:
    if isinstance(date_value, str):
        return date_value
    return date_value.strftime('%b. %-d, %Y')

def format_days_left_message(days_left: int) -> Union[str, str]:
    if isinstance(days_left, str):
        return days_left
    # Check if the number is negative
    if 2 < days_left <= 7:
        return f"{days_left}⚠️"
    elif days_left <= 2:
        return f"{days_left}🚑"
    else:
        return f"{days_left}"


def get_objs_disable_false(latest_dates):
    patients_ukr_15 = {}
    patients_mld_15 = {}

    with transaction.atomic():
        for date in latest_dates:
            surrogacy = date.surrogacy

            date_when_15_days_left = find_when_15_days_left(surrogacy, date.exit)

            if isinstance(date_when_15_days_left, str) or \
                    surrogacy and date_when_15_days_left is not None and \
                    get_date_or_str(date_when_15_days_left) <= 15:

                if surrogacy.country == 'UKR':
                    patients_ukr_15[surrogacy.name] = [date_when_15_days_left]
                else:
                    patients_mld_15[surrogacy.name] = [date_when_15_days_left]

    days_20_left_ukr = [
        (f'{convert_number_to_emoji(index)}*{k}*\n\t'
         f'     Отсчет 15-ти дней: *{format_date(v[0])}*;\n\t'
         f'     Дней осталось: *{format_days_left_message(get_date_or_str(v[0]))}*\n')
        for index, (k, v) in
        enumerate(sorted(patients_ukr_15.items(), key=lambda item: item, reverse=True), start=1)
    ]

    days_20_left = [
        (f'{convert_number_to_emoji(index)}*{k}*\n\t'
         f'     Отсчет 15-ти дней: *{format_date(v[0])}*;\n\t'
         f'     Дней осталось: *{format_days_left_message(get_date_or_str(v[0]))}*\n')
        for index, (k, v) in
        enumerate(sorted(patients_mld_15.items(), key=lambda item: item, reverse=True), start=1)
    ]

    result = [(''.join(days_20_left_ukr),),
              (''.join(days_20_left),), ]
    return result


async def make_message_content(result):
    ukraine = f'🇺🇦 When 15 days left date:\n\n{result[0][0]}\n'

    moldova = f'🇲🇩 When 15 days left date:\n\n{result[1][0]}\n'

    return ukraine + moldova


def convert_number_to_emoji(number, start_from=1):
    number_emojis = {
        0: '0️⃣',
        1: '1️⃣',
        2: '2️⃣',
        3: '3️⃣',
        4: '4️⃣',
        5: '5️⃣',
        6: '6️⃣',
        7: '7️⃣',
        8: '8️⃣',
        9: '9️⃣'
    }

    adjusted_number = number + start_from - 1
    return ''.join(number_emojis[int(digit)] for digit in str(adjusted_number))


def calculate_last_disable_dates_sync():
    with transaction.atomic():
        latest_entry_subquery = Date.objects.filter(
            surrogacy_id=OuterRef('surrogacy_id'),
            disable=False
        ).order_by('-exit').values('exit')[:1]

        latest_dates = Date.objects.filter(
            exit=Subquery(latest_entry_subquery),
            disable=False
        )
        return latest_dates


def get_last_message():
    with transaction.atomic():
        return Message.objects.order_by('-timestamp').first()


def delete_last_message(last_message):
    if last_message:
        with transaction.atomic():
            last_message.delete()


def find_when_15_days_left(instance: SurrogacyMother,
                           control_date: datetime,
                           pre_fetched_dates: Optional[QuerySet[Date]] = None,
                           country: str = None
                           ) -> Union[datetime.date, str]:
    if pre_fetched_dates is not None and country is not None:
        raise ValueError("You cannot use 'country' when 'pre_fetched_dates' is provided.")

    kiev_tz = pytz.timezone('Europe/Kiev')

    control_date = kiev_tz.localize(datetime.combine(control_date, datetime.min.time()))

    date_when_15_days_left = None
    days_incremented = 0
    days_left = 0

    while days_incremented < 90 or days_left > 0:

        beginning_180_days = control_date - timedelta(days=179)

        if pre_fetched_dates is not None:
            dates = [date for date in pre_fetched_dates
                     if date.entry <= control_date.date() and date.exit >= beginning_180_days.date()]
        else:
            dates = list(Date.objects.filter(
                surrogacy_id=instance.id,
                entry__lte=control_date.date(),
                exit__gte=beginning_180_days.date(),
                country=instance.country if country is None else country
            ).only('entry', 'exit').iterator(chunk_size=50))

        if len(dates) <= 0:
            return 'has`t computed dates'

        # Calculate total days stayed in the 180-day window
        total_days_stayed = 0
        for i, date in enumerate(dates):

            entry_date = kiev_tz.localize(datetime.combine(date.entry, datetime.min.time()))
            exit_date = kiev_tz.localize(datetime.combine(date.exit, datetime.min.time()))

            if i == len(dates) - 1:
                exit_date = control_date
            else:
                entry_date = max(entry_date, beginning_180_days)
                exit_date = min(exit_date, control_date)

            # Calculate the stay duration
            stay_duration = max(1, (exit_date - entry_date).days + 1)

            total_days_stayed += stay_duration

            days_left = 90 - total_days_stayed


        if days_left == 0 and date_when_15_days_left is None:
            date_when_15_days_left = control_date - timedelta(days=15)

        if days_left == 0:
            break

        if days_left < 0 and date_when_15_days_left is None:
            return 'Over limit'

        control_date += timedelta(days=1)
        days_incremented += 1

    return date_when_15_days_left.date() if date_when_15_days_left else "Couldn't determine date"
