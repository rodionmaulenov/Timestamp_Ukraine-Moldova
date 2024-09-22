document.addEventListener('DOMContentLoaded', function() {

    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {

            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {

                    const addRow = node.matches && node.matches('tr.add-row') ? node : null;

                    if (addRow) {
                        const addLink = addRow.querySelector('td[colspan="5"] a');
                        if (addLink) {
                            // Shorten the text in the <a> tag
                            if (addLink.innerText.includes('Добавить')) {
                                addLink.innerText = 'Добавить';
                            } else if (addLink.innerText.includes('Add')) {
                                addLink.innerText = 'Add';
                            }
                        }
                    }
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
