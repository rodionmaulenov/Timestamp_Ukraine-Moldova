document.addEventListener("DOMContentLoaded", function () {
    let scheduled = false;

    const observer = new MutationObserver(function (mutationsList) {
        if (!scheduled) {
            scheduled = true;
            requestAnimationFrame(() => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        removeRedundantDateTimeShortcut()
                    }
                }
                scheduled = false; // reset after running
            });
        }
    });

    const targetNode = document.querySelector('.tabular');
    if (targetNode) {
        observer.observe(targetNode, {childList: true, subtree: true}); // Observe the entire subtree
    }
});

function removeRedundantDateTimeShortcut() {

    const tableDateShortcuts = document.querySelectorAll(".tabular .date");

    tableDateShortcuts.forEach((dateElement) => {
        const shortcuts = dateElement.querySelectorAll('.datetimeshortcuts');

        if (shortcuts.length > 1) {
            // Remove the second shortcut if it exists
            shortcuts[1].remove();
        }
    });


    const allTimezoneWarnings = document.querySelectorAll('.help.timezonewarning')
    allTimezoneWarnings.forEach(function (timezoneWarningDiv) {
        timezoneWarningDiv.remove()
    });
}