console.log("Key set:", !!process.env.PADDLE_SANDBOX_API_KEY);
const res = await fetch("https://sandbox-api.paddle.com/products", {
  headers: { "Authorization": `Bearer ${process.env.PADDLE_SANDBOX_API_KEY}` }
});
const data = await res.json();
console.log("Products count:", data.data?.length);
if (data.data?.length > 0) {
  console.log("First product meta:", JSON.stringify(data.data[0].import_meta));
}
