import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

export async function onRequestPost({ request, env }) {
    try {
        // 1. Check for Environment Variable
        if (!env.STRIPE_SECRET_KEY) {
            return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY in Cloudflare Settings." }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        // 2. Initialize Stripe with Fetch for Workers
        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient(),
        });

        // 3. Parse Body
        const body = await request.json();
        const { cart } = body;

        if (!cart || !Array.isArray(cart)) {
            return new Response(JSON.stringify({ error: "Invalid cart data." }), { status: 400 });
        }

        // 4. Create Session
        const session = await stripe.checkout.sessions.create({
            line_items: cart.map(item => ({
                price: item.priceId,
                quantity: parseInt(item.qty) || 1,
            })),
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/success.html`,
            cancel_url: `${new URL(request.url).origin}/cart.html`,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
}
