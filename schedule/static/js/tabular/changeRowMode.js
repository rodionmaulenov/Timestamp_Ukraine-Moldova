window.onload = function () {
    // Function to replace input fields with plain text and hide the original input and other elements
    function replaceWithTextAndHideField(field) {
        if (field && !field.classList.contains('processed')) {
            const value = field.value;  // Get the value of the input field

            // Create a new paragraph element and set the text content
            const textElement = document.createElement('p');
            textElement.textContent = value;
            textElement.classList.add('plain-text'); // Add a class for styling if needed

            // Get the parent <p> tag with class "date"
            const parentP = field.closest('p.date');
            if (parentP) {
                // Specifically hide <input> and <span> elements inside <p.date>
                const inputElement = parentP.querySelector('input');
                const spanElements = parentP.querySelectorAll('span');

                if (inputElement) inputElement.style.display = 'none'; // Hide the input
                spanElements.forEach(span => span.style.display = 'none'); // Hide each span element

                // Add the plain text element inside <p.date> if it's not already there
                if (!parentP.querySelector('.plain-text')) {
                    parentP.appendChild(textElement);
                }
            }
        }
    }

    // Function to replace select dropdown with plain text
    function replaceSelectWithTextAndHide(selectField) {
        if (selectField && !selectField.classList.contains('processed')) {
            const selectedText = selectField.options[selectField.selectedIndex].text;  // Get the selected text
            const textElement = document.createElement('p');  // Create a new paragraph element
            textElement.textContent = selectedText;  // Set the selected text as the content
            textElement.classList.add('plain-text'); // Add a class for styling if needed

            // Hide the dropdown but keep it in the DOM for form submission
            selectField.style.display = 'none';
            // Insert the plain text after the dropdown
            selectField.parentNode.insertBefore(textElement, selectField.nextSibling);

            // Mark this field as processed
            selectField.classList.add('processed');
        }
    }

    // Function to replace checkboxes with a checkmark or unchecked icon
    function replaceCheckboxWithTextAndHide(checkboxField) {
        if (checkboxField && !checkboxField.classList.contains('processed')) {
            const textElement = document.createElement('p');  // Create a new paragraph element
            if (checkboxField.checked) {
                textElement.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#216e39" class="bi bi-patch-check-fill" viewBox="0 0 16 16">
                  <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
                </svg>`;
            }

            textElement.classList.add('plain-text'); // Add a class for styling if needed

            // Hide the checkbox but keep it in the DOM for form submission
            checkboxField.style.display = 'none';

            // Insert the plain text after the checkbox
            checkboxField.parentNode.insertBefore(textElement, checkboxField.nextSibling);

            // Mark this field as processed
            checkboxField.classList.add('processed');
        }
    }

    // Function to toggle the visibility of the form fields
    function toggleRowVisibility(row, button) {
        const entryField = row.querySelector('input[name$="-entry"]');
        const exitField = row.querySelector('input[name$="-exit"]');
        const countryField = row.querySelector('select[name$="-country"]');
        const disableCheckbox = row.querySelector('input[name$="-disable"]');

        // Plain text elements that were added to replace the original inputs
        const plainTextElements = row.querySelectorAll('.plain-text');

        // Check if form fields are currently hidden (i.e., plain text is visible)
        const isHidden = entryField && entryField.style.display === 'none';

        // Toggle visibility of form fields and plain text elements
        if (isHidden) {
            // Show the form fields (make them editable)
            plainTextElements.forEach(el => el.style.display = 'none'); // Hide plain text elements

            if (entryField) {
                const parentP = entryField.closest('p.date');
                const spanElements = parentP.querySelectorAll('span');  // Find related span elements
                entryField.style.display = '';  // Show the input field
                spanElements.forEach(span => span.style.display = '');  // Show the span elements
            }

            if (exitField) {
                const parentP = exitField.closest('p.date');
                const spanElements = parentP.querySelectorAll('span');  // Find related span elements
                exitField.style.display = '';  // Show the input field
                spanElements.forEach(span => span.style.display = '');  // Show the span elements
            }

            if (countryField) {
                countryField.style.display = '';  // Restore the select field
            }

            if (disableCheckbox) {
                disableCheckbox.style.display = '';  // Restore the checkbox
            }

            // Switch to the minus icon for hiding (editable state)
            setButtonIcon(button, 'minus');
        } else {
            // Hide the form fields and show the plain text (make them non-editable)
            plainTextElements.forEach(el => el.style.display = ''); // Show plain text elements

            if (entryField) {
                const parentP = entryField.closest('p.date');
                const spanElements = parentP.querySelectorAll('span');  // Find related span elements
                entryField.style.display = 'none';  // Hide the input field
                spanElements.forEach(span => span.style.display = 'none');  // Hide the span elements
            }

            if (exitField) {
                const parentP = exitField.closest('p.date');
                const spanElements = parentP.querySelectorAll('span');  // Find related span elements
                exitField.style.display = 'none';  // Hide the input field
                spanElements.forEach(span => span.style.display = 'none');  // Hide the span elements
            }

            if (countryField) {
                countryField.style.display = 'none';  // Hide the select field
            }

            if (disableCheckbox) {
                disableCheckbox.style.display = 'none';  // Hide the checkbox
            }

            // Switch to the plus icon for showing (non-editable state)
            setButtonIcon(button, 'plus');
        }
    }

    // Function to set the SVG icon (either plus or minus)
    function setButtonIcon(button, type) {
        // Remove existing icon if any
        button.innerHTML = '';

        // Create the new SVG element
        const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgIcon.setAttribute("width", "18");
        svgIcon.setAttribute("height", "18");
        svgIcon.setAttribute("fill", "currentColor");

        if (type === 'minus') {
            svgIcon.setAttribute("class", "bi bi-file-minus");
            svgIcon.setAttribute("viewBox", "0 0 16 16");

            const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path1.setAttribute("d", "M5.5 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5");

            const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path2.setAttribute("d", "M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM4 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z");

            svgIcon.appendChild(path1);
            svgIcon.appendChild(path2);
        } else {
            svgIcon.setAttribute("class", "bi bi-file-plus-fill");
            svgIcon.setAttribute("viewBox", "0 0 16 16");

            const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path1.setAttribute("d", "M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2M8.5 6v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 1 0");

            svgIcon.appendChild(path1);
        }

        // Append the SVG to the button
        button.appendChild(svgIcon);
    }

    // Function to add a "Revert" button to each row
    function addRevertButton(row) {
        let actionTd = row.querySelector('.action-td');

        if (!actionTd) {
            actionTd = document.createElement('td');
            actionTd.classList.add('action-td');  // Add a class for styling

            const revertButton = document.createElement('button');
            revertButton.classList.add('revert-button');

            // Set initial icon to "plus" (form is initially non-editable)
            setButtonIcon(revertButton, 'plus');

            actionTd.appendChild(revertButton);
            row.appendChild(actionTd);

            // Add event listener to toggle the row's visibility and button icon
            revertButton.addEventListener('click', function (event) {
                event.preventDefault(); // Prevent form submission or navigation
                toggleRowVisibility(row, revertButton); // Toggle the visibility of the form fields
            });
        }
    }


    // Function to process each row in the table
    function processTableRows() {
        const tbody = document.querySelector('fieldset table tbody');

        if (tbody) {
            // Get all rows with the class 'form-row has_original'
            const rows = tbody.querySelectorAll('tr.form-row.has_original');
            rows.forEach((row) => {
                // Process each <td> within the row
                const entryField = row.querySelector('input[name$="-entry"]');
                const exitField = row.querySelector('input[name$="-exit"]');
                const countryField = row.querySelector('select[name$="-country"]');
                const disableCheckbox = row.querySelector('input[name$="-disable"]');

                if (disableCheckbox && disableCheckbox.checked) {
                    replaceWithTextAndHideField(entryField);
                    replaceWithTextAndHideField(exitField);
                    replaceSelectWithTextAndHide(countryField);
                    replaceCheckboxWithTextAndHide(disableCheckbox);

                    // Add the "Revert" button at the end of the row
                    addRevertButton(row);
                }

            });
        }
    }

    // Use MutationObserver to monitor added rows and re-process all rows
    function monitorRowChanges() {
        const tbody = document.querySelector('fieldset table tbody');

        if (tbody) {
            const observer = new MutationObserver(() => {
                processTableRows(); // Re-process all rows when new row is added
            });

            // Start observing tbody for child nodes being added
            observer.observe(tbody, { childList: true });
        }
    }

    // Initial processing of all rows
    processTableRows();

    // Monitor the row changes and re-process when a new row is added
    monitorRowChanges();
};


