// Function to add copy functionality to the tooltip
function addCopyFunctionality(tooltipElement) {
    // Now attach the event listener for the `#copy-deadline` after the tooltip is added
    const copyButton = tooltipElement.querySelector('#copy-deadline');
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            // Find the next sibling which is the div we want to copy from
            const contentToCopy = this.closest('.tooltip_content').nextElementSibling.innerText;

            // Create a temporary input field to copy the text to the clipboard
            const tempInput = document.createElement('input');
            tempInput.style.position = 'absolute';
            tempInput.style.left = '-9999px';
            document.body.appendChild(tempInput);
            tempInput.value = contentToCopy;

            // Select and copy the text
            tempInput.select();
            document.execCommand('copy');

            // Remove the temporary input field
            document.body.removeChild(tempInput);

            // Optionally, show a message to confirm copy
            alert('Text copied to clipboard: ' + contentToCopy);
        });
    }
}
