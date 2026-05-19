const res = await fetch("https://sandbox-api.paddle.com/products", {
  headers: { "Authorization": `Bearer ${process.env.PADDLE_SANDBOX_API_KEY}` }
});
console.log("Status:", res.status);
const data = await res.json();
console.log("Data:", JSON.stringify(data));
