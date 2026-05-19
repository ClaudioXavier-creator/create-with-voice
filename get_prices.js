const PADDLE_API_URL = "https://sandbox-api.paddle.com";
const PADDLE_API_KEY = process.env.PADDLE_SANDBOX_API_KEY;

async function fetchAll(path) {
  let results = [];
  let next = `${PADDLE_API_URL}${path}`;
  while (next) {
    try {
      const res = await fetch(next, {
        headers: { "Authorization": `Bearer ${PADDLE_API_KEY}` }
      });
      const data = await res.json();
      if (!data.data) break;
      results = results.concat(data.data);
      next = data.meta?.pagination?.next;
    } catch (e) {
      break;
    }
  }
  return results;
}

async function run() {
  const products = await fetchAll("/products");
  const prices = await fetchAll("/prices");
  
  const mapping = {};
  
  for (const price of prices) {
    if (!price || !price.product_id) continue;
    const product = products.find(p => p && p.id === price.product_id);
    if (!product || !price.import_meta?.external_id) continue;
    
    const extId = price.import_meta.external_id;
    mapping[extId] = {
      id: price.id,
      name: product.name,
      amount: price.unit_price.amount,
      currency: price.unit_price.currency_code,
      interval: price.billing_cycle?.interval || "one-time"
    };
  }
  
  console.log(JSON.stringify(mapping, null, 2));
}

run();
