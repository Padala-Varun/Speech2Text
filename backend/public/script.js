document.getElementById('downloadBtn').addEventListener('click', async () => {
    const urlInput = document.getElementById('urlInput');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('errorMsg');
    const videoPlayer = document.getElementById('videoPlayer');
    const downloadLink = document.getElementById('downloadLink');
    const loader = document.getElementById('loader');
    const downloadBtn = document.getElementById('downloadBtn');

    const url = urlInput.value.trim();

    if (!url) {
        showError('Please enter a valid URL');
        return;
    }

    // Reset UI
    errorDiv.style.display = 'none';
    resultDiv.style.display = 'none';
    loader.classList.remove('hidden');
    downloadBtn.disabled = true;

    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (response.ok && data.videoUrl) {
            videoPlayer.src = data.videoUrl;
            downloadLink.href = data.videoUrl;
            resultDiv.style.display = 'block';
        } else {
            showError(data.error || 'Failed to download reel.');
        }

    } catch (err) {
        showError('An error occurred. Please try again.');
        console.error(err);
    } finally {
        loader.classList.add('hidden');
        downloadBtn.disabled = false;
    }
});

function showError(msg) {
    const errorDiv = document.getElementById('errorMsg');
    errorDiv.innerText = msg;
    errorDiv.style.display = 'block';
}
