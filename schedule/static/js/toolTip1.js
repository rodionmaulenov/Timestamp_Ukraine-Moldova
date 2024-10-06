let activeTooltip = null;
let activeElement = null;

function toggleTooltip(event, element) {
    event.preventDefault();

    // When clicking the link `Info`, find the `tooltip_element`
    const originalTooltipElement = element.closest('.tooltip_link').nextElementSibling;

    // If the tooltip is already appended to the body and active, close it
    if (activeTooltip && activeElement === element) {
        closeTooltip();
        return;
    }

    // Clone the tooltip and append it to the body
    const tooltipElement = originalTooltipElement.cloneNode(true);
    tooltipElement.classList.add('active');
    tooltipElement.style.position = 'absolute';
    document.body.appendChild(tooltipElement);

    // Get the position of the tooltip relative to the clicked link
    const rect = element.getBoundingClientRect();
    tooltipElement.style.left = `${rect.left + window.scrollX}px`;
    tooltipElement.style.top = `${rect.bottom + window.scrollY}px`;

    // Set this tooltip as the active tooltip
    activeTooltip = tooltipElement;
    activeElement = element;

    // Copy the data from tooltip
    addCopyFunctionality(tooltipElement);

    // Initialize Air Datepicker on the date input inside the tooltip
    const inputField = tooltipElement.querySelector('input[type="text"]');
    if (inputField) {
        $(inputField).datepicker({
            dateFormat: 'yyyy-mm-dd',
            autoClose: true,
            onShow: function (inst) {
                // Get the dynamically generated datepicker container
                const datepickerElement = document.querySelector('.datepicker');
                if (datepickerElement) {
                    datepickerElement.classList.add('active');  // Add 'active' class when the datepicker is shown
                    document.removeEventListener('click', handleOutsideClick);
                }
            },
            onHide: function (inst) {
                // Get the dynamically generated datepicker container
                const datepickerElement = document.querySelector('.datepicker');
                if (datepickerElement) {
                    datepickerElement.classList.remove('active');  // Remove 'active' class when the datepicker is hidden
                    // Add the outside click listener to close the tooltip
                    setTimeout(() => {
                        document.addEventListener('click', handleOutsideClick);
                    }, 400); // Small delay to ensure tooltip remains open
                }
            },

            onSelect: function (formattedDate, date, inst) {
                const inputField = inst.el;
                const surrogacyMotherId = inputField.getAttribute('data-mother-id');
                const surrogacyMotherCountry = inputField.getAttribute('data-mother-country');
                const country = inputField.getAttribute('data-country');

                // Trigger the calculateDaysLeft function
                calculateDaysLeftToolTip(surrogacyMotherId, surrogacyMotherCountry, country, formattedDate, tooltipElement);
            }
        });
    }

    // Prevent the tooltip from closing when clicking inside the tooltip itself
    tooltipElement.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent the click event from reaching the document
    });
    // Add the outside click listener to close the tooltip
    document.addEventListener('click', handleOutsideClick);
}


function handleOutsideClick(e) {

    if (activeTooltip &&
        !activeTooltip.contains(e.target) &&
        !activeElement.contains(e.target)) {
        closeTooltip();
    }
}


function closeTooltip() {
    if (activeTooltip) {
        activeTooltip.classList.remove('active');
        if (document.body.contains(activeTooltip)) {
            document.body.removeChild(activeTooltip);
        }
        activeTooltip = null;
        activeElement = null;

        // Remove the outside click event listener
        document.removeEventListener('click', handleOutsideClick);
    }
}


$(document).ready(function () {
    // Initialize the datepicker with the onSelect event
    $('.datepicker-here').datepicker({
        dateFormat: 'yyyy-mm-dd',  // Set your desired date format
        onSelect: function (formattedDate, date, inst) {
            const inputField = inst.el;  // Get the input field associated with the datepicker
            const surrogacyMotherId = inputField.getAttribute('data-mother-id');
            const surrogacyMotherCountry = inputField.getAttribute('data-mother-country');
            const country = inputField.getAttribute('data-country');

            // Trigger the calculateDaysLeft function
            calculateDaysLeft(surrogacyMotherId, surrogacyMotherCountry, country, formattedDate);
        }
    });
});









