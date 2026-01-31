
async function test() {
    try {
        console.log("Sending request to http://localhost:3000/api/download...");
        const response = await fetch('http://localhost:3000/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://www.instagram.com/reel/DUIqXr6gcfl/?igsh=cWdxY3YzYTFmMW5u' })
        });

        console.log(`Response Status: ${response.status}`);
        const data = await response.json();

        if (response.ok) {
            console.log('SUCCESS: Request processed.');
            console.log('Message:', data.message);
            console.log('Saved to:', data.localPath);
            console.log('Filename:', data.filename);
        } else {
            console.log('FAILURE: API returned an error.');
            console.log('Error:', data);
        }
    } catch (e) {
        console.error('EXCEPTION: Could not connect to server or parse response.');
        console.error(e);
    }
}

test();
