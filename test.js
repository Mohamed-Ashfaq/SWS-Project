const fs = require('fs');

async function runTests() {
  console.log("--- Starting Automated API Tests ---");
  const baseUrl = 'http://localhost:3000/api';
  
  try {
    // 1. Test Upload
    console.log("1. Testing Document Upload...");
    const formData = new FormData();
    const testContent = "This is an automated test document containing the secret keyword banana.";
    const blob = new Blob([testContent], { type: 'text/plain' });
    formData.append('file', blob, 'test-script-doc.txt');

    const uploadRes = await fetch(`${baseUrl}/documents`, {
      method: 'POST',
      body: formData
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error("Failed to upload: " + uploadData.error);
    
    console.log("✅ Upload successful. Document ID:", uploadData.document.id);
    const docId = uploadData.document.id;

    // 2. Test List
    console.log("2. Testing Document Listing...");
    const listRes = await fetch(`${baseUrl}/documents`);
    const listData = await listRes.json();
    if (!listData.some(d => d.id === docId)) throw new Error("New document was not found in the list API");
    console.log("✅ Listing successful. Document found in database.");

    // 3. Test Chat (Search)
    console.log("3. Testing AI Chat Search...");
    const chatRes = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: "Where is the banana?" })
    });
    const chatData = await chatRes.json();
    if (!chatData.sources.some(s => s._id === docId)) {
      throw new Error("Chat API failed to find the document based on keywords");
    }
    console.log("✅ Chat Search successful. AI correctly found the document source.");

    // 4. Test Delete
    console.log("4. Testing Document Deletion...");
    const deleteRes = await fetch(`${baseUrl}/documents/${docId}`, { method: 'DELETE' });
    if (!deleteRes.ok) throw new Error("Delete API failed");
    console.log("✅ Deletion successful. Cleaned up the test document.");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The application works perfectly.");

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    console.log("Make sure your Next.js server is running (npm run dev) before running tests!");
  }
}

runTests();
