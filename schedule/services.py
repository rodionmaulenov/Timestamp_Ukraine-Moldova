import logging
import pytz
from datetime import timedelta, datetime
from django.db.models import OuterRef, Subquery
from aiogram.types import BufferedInputFile
from asgiref.sync import sync_to_async
from schedule.models import Date
from PIL import Image
from io import BytesIO
import aiohttp
import random

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def get_random_cat_photo_with_text():
    logger.info("Fetching a random cat photo with text.")

    hello_texts = ["Hello", "Hola", "Bonjour", "Hallo", "Ciao", "Привет", "ПивПив", "МяоКокао",
                   "Raxmat Shimkentskie", "Bolshe Valericha", "Chistim zybu", "Xvatit boltat",
                   "Alo garag", "Parvana sroki goryat", "Ainura i gdu UZI", "Gad idi suda"]

    colors = ["red", "green", "blue", "yellow", "white", "orange", "pink"]

    font_size = 63
    font_color = random.choice(colors)
    hello_text = random.choice(hello_texts)

    url = f"https://cataas.com/cat/says/{hello_text}?fontSize={font_size}&fontColor={font_color}"
    logger.info("Generated URL: %s", url)

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


def calculate_dates(instance, control_date):
    # Define the Kiev time zone using pytz
    kiev_tz = pytz.timezone('Europe/Kiev')

    # Assuming control_date is a date object; convert it to a datetime object at midnight
    control_date = datetime.combine(control_date, datetime.min.time())

    # Convert control_date to a timezone-aware datetime object in Kiev timezone
    control_date = kiev_tz.localize(control_date)

    # Calculate the start of the 180-day period at midnight in Kiev timezone
    beginning_180_days = control_date - timedelta(days=179)

    # Initialize total days stayed within the 180-day window
    total_days_stayed = 0

    # Fetch relevant dates; ensure your Date model has datetime fields
    dates = Date.objects.filter(
        surrogacy_id=instance.id,
        entry__lte=control_date.date(),
        exit__gte=beginning_180_days.date(),
        country=instance.country_selection
    )

    # Iterate through each date record
    for date in dates:

        # Convert entry and exit dates to datetime objects at midnight in Kiev timezone
        make_datetime_entry = datetime.combine(date.entry, datetime.min.time())
        entry_date = kiev_tz.localize(make_datetime_entry)

        make_datetime_exit = datetime.combine(date.exit, datetime.min.time())
        exit_date = kiev_tz.localize(make_datetime_exit)

        # Adjust entry_date and exit_date to fit within the 180-day period
        entry_date = max(entry_date, beginning_180_days)
        exit_date = min(exit_date, control_date)

        # Calculate the stay duration
        if entry_date == exit_date:
            stay_duration = 1  # If entry date is the same as exit date, count as 1 day
        else:
            stay_duration = (exit_date - entry_date).days + 1

        # Accumulate the total days stayed
        total_days_stayed += stay_duration

    # Calculate days left inclusively
    days_left = 90 - total_days_stayed

    return days_left, total_days_stayed


def get_objs_disable_false(latest_dates):
    # latest dates that is each last `Date` instance not disabled for surrogacyMother

    patients_ukr = {}
    patients_mld = {}
    patients_ukr_10 = {}
    patients_mld_10 = {}
    for date in latest_dates:
        obj = date.surrogacy

        days_left, total_days_stayed = calculate_dates(obj, date.exit)

        if days_left <= 10:
            if obj.country_selection == 'UKR':
                patients_ukr_10[date.surrogacy.name] = [days_left, total_days_stayed]

            else:
                patients_mld_10[date.surrogacy.name] = [days_left, total_days_stayed]

        if 11 < days_left <= 30:
            if obj.country_selection == 'UKR':
                patients_ukr[date.surrogacy.name] = [days_left, total_days_stayed]
            else:
                patients_mld[date.surrogacy.name] = [days_left, total_days_stayed]

    days_10_left_ukr = [
        f'{convert_number_to_emoji(index)}. *Name:* {k} *Days left:* {v[0]}  *Days passed:* {v[1]}\n'
        for index, (k, v) in
        enumerate(sorted(patients_ukr_10.items(), key=lambda item: item[1][0]), start=1)
    ]

    days_30_left_ukr = [
        f'{convert_number_to_emoji(index)}. *Name:* {k} *Days left:* {v[0]}  *Days passed:* {v[1]}\n'
        for index, (k, v) in
        enumerate(sorted(patients_ukr.items(), key=lambda item: item[1][0]), start=1)
    ]

    days_10_left_mld = [
        f'{convert_number_to_emoji(index)}. *Name:* {k} *Days left:* {v[0]}  *Days passed:* {v[1]}\n'
        for index, (k, v) in
        enumerate(sorted(patients_mld_10.items(), key=lambda item: item[1][0]), start=1)
    ]

    days_30_left_mld = [
        f'{convert_number_to_emoji(index)}. *Name:* {k} *Days left:* {v[0]}  *Days passed:* {v[1]}\n'
        for index, (k, v) in
        enumerate(sorted(patients_mld.items(), key=lambda item: item[1][0]), start=1)
    ]

    result = [(''.join(days_10_left_ukr), ''.join(days_30_left_ukr)),
              (''.join(days_10_left_mld), ''.join(days_30_left_mld))]

    return result


async def make_message_content(result):
    ukraine = f'🇺🇦 Ukraine who has <=10 days: \n' + f'{result[0][0]}' + \
              f'🇺🇦 Ukraine who has 10<=30 days: \n' + f'{result[0][1]}\n'

    moldova = f'🇲🇩 Moldova who has <=10 days: \n' + f'{result[1][0]}' + \
              f'🇲🇩 Moldova who has 10<=30 days: \n' + f'{result[1][1]}'

    return ukraine + moldova


def convert_number_to_emoji(number):
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

    return ''.join(number_emojis[int(digit)] for digit in str(number))


async def calculate_last_disable_dates():
    latest_entry_subquery = await sync_to_async(lambda: Date.objects.filter(
        surrogacy_id=OuterRef('surrogacy_id'),
        disable=False
    ).order_by('-entry').values('entry')[:1])()

    latest_dates = await sync_to_async(lambda: Date.objects.filter(
        entry=Subquery(latest_entry_subquery),
        disable=False
    ).all())()

    return latest_dates


def calculate_last_disable_dates_sync():
    latest_entry_subquery = Date.objects.filter(
        surrogacy_id=OuterRef('surrogacy_id'),
        disable=False
    ).order_by('-entry').values('entry')[:1]

    latest_dates = Date.objects.filter(
        entry=Subquery(latest_entry_subquery),
        disable=False
    )
    return latest_dates
