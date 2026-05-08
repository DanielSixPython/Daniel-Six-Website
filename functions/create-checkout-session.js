import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
    try {
        // 1. Validate Secret Key
        if (!env.STRIPE_SECRET_KEY) {
            return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not set in Cloudflare Settings." }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        // 2. Parse Request
        const body = await request.json();
        const { cart } = body;

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return new Response(JSON.stringify({ error: "Cart data is missing." }), { status: 400 });
        }

        // 3. Initialize Stripe
        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient()
        });

        // 4. Map Line Items
        const lineItems = cart.map(item => ({
            price: item.priceId,
            quantity: parseInt(item.qty) || 1,
        }));

        // 5. Create Session
        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
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
