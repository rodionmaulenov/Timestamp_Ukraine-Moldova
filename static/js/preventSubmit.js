document.addEventListener('DOMContentLoaded', function() {
    // Get all save buttons in the Django admin form
    const saveButtons = document.querySelectorAll('input[type=submit][name^="_"]');

    // Check if the disable checkbox and the entry/exit date fields exist for any row
    function shouldShowPopup() {
        const rows = document.querySelectorAll('tr.dynamic-choose_dates');

        for (let i = 0; i < rows.length; i++) {
            const entryField = rows[i].querySelector('input[type="text"][name$="-entry"]');
            const exitField = rows[i].querySelector('input[type="text"][name$="-exit"]');

            // Check if the checkbox is checked and either date field has a value
            if (entryField.value || exitField.value) {
                return true; // If any row meets the criteria, show the popup
            }
        }
        return false; // No rows meet the criteria
    }

    // Add a click event listener to each save button
    saveButtons.forEach(function(button) {
        button.addEventListener('click', function(event) {
            // Check if conditions are met for showing the popup
            if (shouldShowPopup()) {
                // Display a confirmation dialog
                if (!confirm('Are you sure you want to proceed?')) {
                    // If the user clicks 'Cancel', prevent the default action (form submission)
                    event.preventDefault();
                }
            }
        });
    });
});
