document.addEventListener('DOMContentLoaded', function() {
    // Select all image containers
    const imageContainers = document.querySelectorAll('.image-container');

    // Iterate over each container
    imageContainers.forEach(container => {
        // Find the image inside the container
        const image = container.querySelector('.hoverable-image');

        // Add click event listener to the container
        container.addEventListener('click', function() {
            // Toggle the 'clicked-image' class on the image
            image.classList.toggle('clicked-image');
        });
    });
});
