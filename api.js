import { startCamera, capturePhoto } from './camera.js';

const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const photo = document.getElementById('photo');
const resultsList = document.getElementById('results');
const captureButton = document.getElementById('capture');

// Start camera
startCamera(video);

// Handle photo capture
captureButton.addEventListener('click', async () => {
    const image = capturePhoto(video, canvas);
    photo.src = image; // Wyświetlamy zdjęcie
    const labels = await analyzeImage(image);

    if (labels.length > 0) {
        const prices = await fetchPrices(labels[0]); // Użyjemy pierwszego wyniku
        displayResults(prices);
    }
});

// Google Vision API integration
async function analyzeImage(image) {
    const apiKey = 'YOUR_GOOGLE_CLOUD_API_KEY'; // Wstaw swój klucz API
    const body = {
        requests: [
            {
                image: { content: image.split(',')[1] },
                features: [{ type: 'WEB_DETECTION' }],
            },
        ],
    };

    const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }
    );

    const data = await response.json();
    const webDetection = data.responses[0]?.webDetection;
    return webDetection?.bestGuessLabels.map((label) => label.label) || [];
}

// eBay API integration
async function fetchPrices(query) {
    const ebayApiKey = 'YOUR_EBAY_API_KEY'; // Wstaw swój klucz API
    const response = await fetch(
        `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}`,
        {
            headers: {
                Authorization: `Bearer ${ebayApiKey}`,
            },
        }
    );

    const data = await response.json();
    return data.itemSummaries.slice(0, 5).map((item) => ({
        title: item.title,
        price: item.price.value,
        link: item.itemWebUrl,
    }));
}

// Display results
function displayResults(prices) {
    resultsList.innerHTML = '';
    prices.forEach((item) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <a href="${item.link}" target="_blank">
                ${item.title} - $${item.price}
            </a>
        `;
        resultsList.appendChild(listItem);
    });
}
