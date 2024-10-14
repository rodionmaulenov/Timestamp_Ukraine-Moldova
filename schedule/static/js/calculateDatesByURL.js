function calculateDaysLeft(surrogacyMotherId, surrogacyMotherCountry, country, selectedDate, inputField,
                           toolTipElement = null) {

    if (selectedDate) {
        const divContainer = inputField.parentElement

        const url = getUrlBasedOnCountry(surrogacyMotherId, selectedDate, surrogacyMotherCountry, country);

        // Perform AJAX request
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'json';

        xhr.onload = function () {
            if (xhr.status === 200 && xhr.response && xhr.response.days_left !== undefined) {
                const daysLeft = xhr.response.days_left;

                const spanElement = buildInputField(divContainer, surrogacyMotherId, country,
                    daysLeft, toolTipElement)

                setTimeout(() => {
                    spanElement.classList.add('fade-in');
                }, 15);

                spanElement.addEventListener('click', function () {
                    showInputFieldGeneric(surrogacyMotherId, surrogacyMotherCountry, country, toolTipElement)
                });
            }
        };

        xhr.send();  // Send the AJAX request
    }
}

function showInputFieldGeneric(surrogacyMotherId, surrogacyMotherCountry, country, tooltipElement = null) {
    const isTooltip = !!tooltipElement
    let divContainer

    if (isTooltip) {
        const divContainerId = 'days-left-tooltip-' + surrogacyMotherId + '-' + country
        divContainer = document.getElementById(divContainerId).parentElement
    } else {
        divContainer = document.getElementById('control-date-container-' + surrogacyMotherId + '-' + country)
    }

    divContainer.innerHTML = ''

    const recreateField = document.createElement('input')
    recreateField.type = 'text'
    recreateField.id = `control-date-${surrogacyMotherId}-${country}`
    recreateField.setAttribute('data-mother-id', surrogacyMotherId)
    recreateField.setAttribute('data-mother-country', surrogacyMotherCountry)
    recreateField.setAttribute('data-country', country)
    recreateField.className = 'vDateField'

    divContainer.appendChild(recreateField)

    if (isTooltip) {
        initializeDjangoCalendarInTooltip(tooltipElement)
    } else {
        if (typeof DateTimeShortcuts !== 'undefined') {
            DateTimeShortcuts.addCalendar(recreateField)
        }
    }
}


function buildInputField(divContainer, surrogacyMotherId, country, daysLeft, tooltipElement = null) {
    const newSpanElement = document.createElement('span')

    // Set id, text, and class based on whether it's a tooltip or not
    const isTooltip = !!tooltipElement
    newSpanElement.id = isTooltip
        ? `days-left-tooltip-${surrogacyMotherId}-${country}`
        : `days-left-${surrogacyMotherId}-${country}`

    newSpanElement.textContent = isTooltip
        ? `appeared days ${daysLeft}`
        : `still days ${daysLeft}`

    newSpanElement.className = isTooltip
        ? 'days_left_tooltip'
        : 'days_left'

    while (divContainer.firstChild) {
        divContainer.removeChild(divContainer.firstChild)
    }
    divContainer.appendChild(newSpanElement)
    return newSpanElement
}


function initializeDjangoCalendarInTooltip(tooltipElement) {
    // Reinitialize the Django DateTimeShortcuts for the calendar inside the tooltip
    const dateField = tooltipElement.querySelector('.vDateField');
    if (typeof DateTimeShortcuts !== 'undefined') {
        DateTimeShortcuts.addCalendar(dateField)

        const calendarLink = tooltipElement.querySelector(`[id^="calendarlink"]`);
        if (calendarLink) {
            const linkId = calendarLink.id
            const linkNumber = linkId.match(/\d+$/)

            calendarLink.addEventListener('click', function () {
                const calendarBoxId = `calendarbox${linkNumber}`
                const calendarBox = document.getElementById(calendarBoxId)
                if (calendarBox) {
                    // Get the tooltip element's position and dimensions
                    const dateIcon = tooltipElement.querySelector('.date-icon')
                    const dateIconRect = dateIcon.getBoundingClientRect()

                    // Set the position of the calendar box based on the tooltip's position
                    calendarBox.style.left = `${dateIconRect.left + 15}px`
                    calendarBox.style.top = `${dateIconRect.top - 150}px`;
                    calendarBox.style.zIndex = `1`
                }
            });
        }
        cleanupDateShortcutsAndWarningsTooltip(tooltipElement)
    }
}

function getUrlBasedOnCountry(surrogacyMotherId, controlDate, surrogacyMotherCountry, country) {
    let url = ''

    if (surrogacyMotherCountry === 'MLD') {
        if (country === 'MLD') {
            url = '/admin/schedule/moldova/calculate_control_date/?id=' + surrogacyMotherId + '&control_date=' + controlDate
        } else {
            url = '/admin/schedule/moldova/calculate_control_date_in_ukr/?id=' + surrogacyMotherId + '&control_date=' + controlDate
        }
    } else if (surrogacyMotherCountry === 'UKR') {
        if (country === 'UKR') {
            url = '/admin/schedule/ukraine/calculate_control_date/?id=' + surrogacyMotherId + '&control_date=' + controlDate
        } else {
            url = '/admin/schedule/ukraine/calculate_control_date_in_mld/?id=' + surrogacyMotherId + '&control_date=' + controlDate
        }
    } else {
        console.error('Unsupported surrogacyMotherCountry: ' + surrogacyMotherCountry)
    }

    return url
}