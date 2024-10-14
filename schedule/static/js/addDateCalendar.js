// document.addEventListener("DOMContentLoaded", function () {
//     observeForChanges();
// });
//
// function observeForChanges() {
//     const observer = new MutationObserver(function (mutationsList) {
//         for (const mutation of mutationsList) {
//             if (mutation.type === 'childList') {
//                 observer.disconnect();
//                 addDatetimeShortcut();  // Initialize datepicker for new elements
//                 observer.observe(mutation.target, { childList: true, subtree: true });
//             }
//         }
//     });
//
//     const targetNode = document.querySelector('#result_list');
//     if (targetNode) {
//         observer.observe(targetNode, { childList: true, subtree: true });
//     }
// }
//
// function addDatetimeShortcut() {
//     const allCustomCalendar = document.querySelectorAll("#result_list .custom_calendar");
//
//     allCustomCalendar.forEach(function (dateShortcuts, index) {
//         const inputField = dateShortcuts.querySelector('input.vDateField');
//
//         // Check if DateTimeShortcuts is available
//         if (inputField && typeof DateTimeShortcuts !== 'undefined') {
//             // Only initialize if not already initialized
//             if (!inputField.dataset.calendarInitialized) {
//                 DateTimeShortcuts.addCalendar(inputField.id);
//                 inputField.dataset.calendarInitialized = "true"; // Mark as initialized
//
//                 // Attach event listener to the calendar link to open the datepicker
//                 const calendarLink = dateShortcuts.querySelector('a[id^="calendarlink"]');
//                 if (calendarLink) {
//                     calendarLink.addEventListener('click', function (e) {
//                         e.preventDefault();
//                         DateTimeShortcuts.openCalendar(index);
//                     });
//                 }
//             }
//         }
//     });
// }
